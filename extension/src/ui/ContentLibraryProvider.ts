import * as vscode from 'vscode';
import fs from 'node:fs/promises';
import type { LibraryItem, HubConfig } from '../types';
import { StorageManager } from '../core/storage/StorageManager';
import { MetadataManager } from '../core/metadata/MetadataManager';

export class ContentLibraryProvider implements vscode.TreeDataProvider<LibraryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<LibraryItem | undefined | void> =
    new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<LibraryItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(
    private config: HubConfig,
    private storage: StorageManager,
    private metadata: MetadataManager,
  ) {}

  // 延迟加载使用次数映射，避免阻塞首帧渲染
  private usageCache?: Map<string, number>;
  private usageLoaded = false;

  private filterQuery: string | undefined;
  private activeCategory: string | undefined;
  private sortMode:
    | 'nameAsc'
    | 'nameDesc'
    | 'catName'
    | 'mtimeAsc'
    | 'mtimeDesc'
    | 'usageAsc'
    | 'usageDesc' = 'nameAsc';

  setFilter(query?: string) {
    this.filterQuery = (query ?? '').trim() || undefined;
    this.refresh();
  }

  setActiveCategory(category?: string) {
    this.activeCategory = category?.trim() || undefined;
    this.refresh();
  }

  // 提供当前分段选择的分类给命令作为兜底
  getActiveCategory(): string | undefined {
    return this.activeCategory;
  }

  setSort(
    mode: 'nameAsc' | 'nameDesc' | 'catName' | 'mtimeAsc' | 'mtimeDesc' | 'usageAsc' | 'usageDesc',
  ) {
    this.sortMode = mode;
    this.refresh();
  }

  getSort():
    | 'nameAsc'
    | 'nameDesc'
    | 'catName'
    | 'mtimeAsc'
    | 'mtimeDesc'
    | 'usageAsc'
    | 'usageDesc' {
    return this.sortMode;
  }

  async getCategoryCounts(applyFilter: boolean = true): Promise<Record<string, number>> {
    const enabledCats = Object.entries(this.config.categories)
      .filter(([, v]) => v.enabled)
      .map(([key]) => key);
    const lowerQuery = (this.filterQuery ?? '').toLowerCase();
    const pairs = await Promise.all(
      enabledCats.map(async (cat) => {
        const files = await this.storage.listFiles(cat);
        const count =
          applyFilter && lowerQuery
            ? files.filter((f) => `${cat}/${f}`.toLowerCase().includes(lowerQuery)).length
            : files.length;
        return [cat, count] as const;
      }),
    );
    const counts: Record<string, number> = {};
    for (const [cat, cnt] of pairs) {
      counts[cat] = cnt;
    }
    return counts;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LibraryItem): vscode.TreeItem {
    const item = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
    item.description = element.description;
    item.contextValue = element.type; // 用于菜单选择：file
    // 方案C：在左侧预留区填充一个小图标，减少"空白"的视觉感
    // 使用通用文件图标，避免依赖不确定的codicon名称
    item.iconPath = new vscode.ThemeIcon('file');
    // 提示信息补充分类与使用次数
    if (element.id) {
      const [cat] = element.id.split('/');
      const cnt = element.description ? Number(element.description) : undefined;
      item.tooltip = cnt != null ? `${cat} • 使用 ${cnt} 次` : cat;
    }
    if (element.type === 'file' && element.path) {
      item.command = {
        command: 'aiRuleHub.openFile',
        title: '打开文件',
        arguments: [element.path],
      };
    }
    return item;
  }

  async getChildren(element?: LibraryItem): Promise<LibraryItem[]> {
    // 扁平化：根层直接返回文件列表（带分类描述）
    if (!element) {
      const enabledCats = Object.entries(this.config.categories)
        .filter(([, v]) => v.enabled)
        .map(([key]) => key);

      const targetCats = this.activeCategory
        ? enabledCats.filter((c) => c === this.activeCategory)
        : enabledCats;

      const lowerQuery = (this.filterQuery ?? '').toLowerCase();
      const results: LibraryItem[] = [];
      // 使用次数改为延迟加载（首次渲染不阻塞）
      const usageMap = this.usageCache;

      const catResults = await Promise.all(
        targetCats.map(async (cat) => {
          const files = await this.storage.listFiles(cat);
          const filtered = lowerQuery
            ? files.filter((f) => `${cat}/${f}`.toLowerCase().includes(lowerQuery))
            : files;
          const items = await Promise.all(
            filtered.map(async (name) => {
              const abs = await this.storage.resolveFilePathFlexible(cat, name);
              const useCnt = usageMap ? (usageMap.get(abs) ?? 0) : undefined;
              return {
                id: `${cat}/${name}`,
                label: name,
                type: 'file',
                collapsible: false,
                description: useCnt != null ? String(useCnt) : undefined,
                path: abs,
              } as LibraryItem;
            }),
          );
          return items;
        }),
      );
      catResults.forEach((items) => results.push(...items));
      // 应用排序
      let sorted: LibraryItem[] = results;
      if (this.sortMode === 'mtimeAsc' || this.sortMode === 'mtimeDesc') {
        // 按更新时间排序：读取文件 mtime
        const mtimes = new Map<string, number>();
        await Promise.all(
          results.map(async (it) => {
            if (!it.path) return;
            try {
              const stat = await fs.stat(it.path);
              mtimes.set(it.id, stat.mtimeMs ?? stat.mtime.getTime());
            } catch {
              mtimes.set(it.id, 0);
            }
          }),
        );
        sorted = results.sort((a, b) => {
          const am = mtimes.get(a.id) ?? 0;
          const bm = mtimes.get(b.id) ?? 0;
          return this.sortMode === 'mtimeAsc' ? am - bm : bm - am;
        });
      } else if (this.sortMode === 'usageAsc' || this.sortMode === 'usageDesc') {
        // 使用频次排序：若尚未加载使用次数，则后台加载并使用名称排序兜底
        if (!this.usageLoaded || !this.usageCache) {
          this.ensureUsageLoaded();
          sorted = results.sort((a, b) => a.label.localeCompare(b.label));
        } else {
          const map = this.usageCache;
          sorted = results.sort((a, b) => {
            const au = a.path ? (map.get(a.path) ?? 0) : 0;
            const bu = b.path ? (map.get(b.path) ?? 0) : 0;
            return this.sortMode === 'usageAsc' ? au - bu : bu - au;
          });
        }
      } else {
        sorted = results.sort((a, b) => {
          const [acat, aname] = a.id.split('/');
          const [bcat, bname] = b.id.split('/');
          if (this.sortMode === 'nameAsc') {
            return aname.localeCompare(bname);
          } else if (this.sortMode === 'nameDesc') {
            return bname.localeCompare(aname);
          } else {
            const catCmp = acat.localeCompare(bcat);
            return catCmp !== 0 ? catCmp : aname.localeCompare(bname);
          }
        });
      }
      // 首次渲染后后台加载使用次数并刷新（若尚未加载）
      if (!this.usageLoaded || !this.usageCache) {
        this.ensureUsageLoaded();
      }
      return sorted;
    }

    // 不再返回分类子节点（因为根层即是文件列表）
    return [];
  }

  private async ensureUsageLoaded() {
    if (this.usageLoaded && this.usageCache) return;
    try {
      const meta = await this.metadata.loadMetadata().catch(() => ({ files: [] }));
      const map = new Map<string, number>();
      meta.files.forEach((f) => map.set(f.path, f.usedCount ?? 0));
      this.usageCache = map;
      this.usageLoaded = true;
      // 数据就绪后刷新一次列表，补全描述并应用可能的使用频次排序
      this.refresh();
    } catch {
      this.usageLoaded = true;
    }
  }
}
