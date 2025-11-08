import * as vscode from 'vscode';
import type { LibraryItem, HubConfig } from '../types';
import { StorageManager } from '../core/storage/StorageManager';

export class ContentLibraryProvider implements vscode.TreeDataProvider<LibraryItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<LibraryItem | undefined | void> =
    new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<LibraryItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(
    private config: HubConfig,
    private storage: StorageManager,
  ) {}

  private filterQuery: string | undefined;

  setFilter(query?: string) {
    this.filterQuery = (query ?? '').trim() || undefined;
    this.refresh();
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LibraryItem): vscode.TreeItem {
    const item = new vscode.TreeItem(
      element.label,
      element.collapsible
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    );
    item.description = element.description;
    item.contextValue = element.type; // 用于菜单选择：category 或 file
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
    if (!element) {
      const cats = Object.entries(this.config.categories)
        .filter(([, v]) => v.enabled)
        .map(([key]) => key);
      const items: LibraryItem[] = [];
      for (const cat of cats) {
        const files = await this.storage.listFiles(cat);
        const count = this.filterQuery
          ? files.filter((f) =>
              `${cat}/${f}`.toLowerCase().includes(this.filterQuery!.toLowerCase()),
            ).length
          : files.length;
        items.push({
          id: cat,
          label: cat,
          type: 'category',
          collapsible: true,
          description: `(${count})`,
        });
      }
      return items;
    }
    if (element.type === 'category') {
      const files = await this.storage.listFiles(element.id);
      const filtered = this.filterQuery
        ? files.filter((f) =>
            `${element.id}/${f}`.toLowerCase().includes(this.filterQuery!.toLowerCase()),
          )
        : files;
      return filtered.map(
        (name) =>
          ({
            id: `${element.id}/${name}`,
            label: name,
            type: 'file',
            collapsible: false,
            path: this.storage.resolveFilePath(element.id, name),
          }) as LibraryItem,
      );
    }
    return [];
  }
}
