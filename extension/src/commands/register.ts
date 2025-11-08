import * as vscode from 'vscode';
import { FileOperations } from '../core/files/FileOperations';
import { StorageManager } from '../core/storage/StorageManager';
import { ContentLibraryProvider } from '../ui/ContentLibraryProvider';
import { MetadataManager } from '../core/metadata/MetadataManager';
import { ConfigManager } from '../config/ConfigManager';
import type { LibraryItem, HubConfig } from '../types';

export function registerCommands(
  context: vscode.ExtensionContext,
  fileOps: FileOperations,
  storage: StorageManager,
  provider: ContentLibraryProvider,
  metadata: MetadataManager,
  configManager: ConfigManager,
  config: HubConfig,
  tree: vscode.TreeView<LibraryItem>,
) {
  // 初始化排序：读取上次选择并应用到 Provider 与标题栏（短标签）
  const sortLabelsLong: Record<string, string> = {
    nameAsc: '名称 A→Z',
    nameDesc: '名称 Z→A',
    catName: '分类→名称',
    mtimeDesc: '更新时间 新→旧',
    mtimeAsc: '更新时间 旧→新',
    usageDesc: '使用频次 高→低',
    usageAsc: '使用频次 低→高',
  };
  const sortLabelsShort: Record<string, string> = {
    nameAsc: '名↑',
    nameDesc: '名↓',
    catName: '类→名',
    mtimeDesc: '更↓',
    mtimeAsc: '更↑',
    usageDesc: '频↓',
    usageAsc: '频↑',
  };
  const savedSort =
    (context.globalState.get('aiRuleHub.sortMode') as keyof typeof sortLabelsShort | undefined) ||
    'nameAsc';
  provider.setSort?.(savedSort as any);
  try {
    tree.title = `文件库（${sortLabelsShort[savedSort]}）`;
  } catch {}
  const commands = [
    vscode.commands.registerCommand('aiRuleHub.openFile', async (arg?: string | LibraryItem) => {
      const filePath = typeof arg === 'string' ? arg : arg?.path;
      if (!filePath) {
        vscode.window.showWarningMessage('未提供文件路径');
        return;
      }
      await fileOps.openFile(filePath);
      await metadata.recordFileUsage(filePath);
    }),
    vscode.commands.registerCommand('aiRuleHub.setSort', async () => {
      const current = provider.getSort?.() ?? 'nameAsc';
      const items = [
        { label: sortLabelsLong.nameAsc, value: 'nameAsc' },
        { label: sortLabelsLong.nameDesc, value: 'nameDesc' },
        { label: sortLabelsLong.catName, value: 'catName' },
        { label: sortLabelsLong.mtimeDesc, value: 'mtimeDesc' },
        { label: sortLabelsLong.mtimeAsc, value: 'mtimeAsc' },
        { label: sortLabelsLong.usageDesc, value: 'usageDesc' },
        { label: sortLabelsLong.usageAsc, value: 'usageAsc' },
      ];
      const pick = await vscode.window.showQuickPick(
        items.map((i) => ({
          label: i.label,
          description: i.value === current ? '当前' : undefined,
        })),
        {
          placeHolder: '选择列表排序方式',
        },
      );
      if (!pick) return;
      const found = items.find((i) => i.label === pick.label);
      if (found) {
        provider.setSort?.(found.value as any);
        // 更新标题（短标签）并记忆最近一次排序
        try {
          tree.title = `文件库（${sortLabelsShort[found.value] ?? found.label}）`;
        } catch {}
        await context.globalState.update('aiRuleHub.sortMode', found.value);
      }
    }),
    vscode.commands.registerCommand('aiRuleHub.insertFile', async (arg?: string | LibraryItem) => {
      const filePath = typeof arg === 'string' ? arg : arg?.path;
      if (!filePath) {
        vscode.window.showWarningMessage('未提供文件路径');
        return;
      }
      await fileOps.insertFileContent(filePath);
      await metadata.recordFileUsage(filePath);
    }),
    vscode.commands.registerCommand('aiRuleHub.createFile', async (node?: LibraryItem) => {
      // 在扁平列表下也能创建：优先使用当前分段选择分类，否则弹出分类选择
      let category: string | undefined;

      if (node && node.type === 'category') {
        category = node.id;
      } else {
        category = provider.getActiveCategory?.();
        if (!category) {
          const enabledCats = Object.entries(config.categories)
            .filter(([, v]) => v.enabled)
            .map(([key]) => key);

          if (enabledCats.length === 0) {
            vscode.window.showErrorMessage('没有启用的分类，无法创建文件');
            return;
          }

          category = await vscode.window.showQuickPick(enabledCats, {
            placeHolder: '选择要创建到的分类',
          });
          if (!category) return;
        }
      }

      const exts = storage.getAllowedExtensions(category);
      // 统一前缀方案优先使用 .md（mcp 使用 .json），否则回退到第一个可用后缀
      const preferredExt = exts.includes('.md')
        ? '.md'
        : exts.includes('.json')
          ? '.json'
          : exts[0];
      // 分类前缀映射（用于文件名前缀）
      const prefixMap: Record<string, string> = {
        rule: 'rule',
        prompt: 'prompt',
        mcp: 'mcp',
        agent: 'agent',
        workflow: 'workflow',
      };
      const prefix = prefixMap[category] ?? category;
      const place = preferredExt ? `${prefix}-example${preferredExt}` : `${prefix}-example.txt`;
      const nameInput = await vscode.window.showInputBox({
        prompt: `在 ${category} 中新建文件`,
        placeHolder: place,
      });
      let name =
        !nameInput || nameInput.trim().length === 0
          ? undefined
          : exts.length > 0 && !exts.some((ext) => nameInput.endsWith(ext))
            ? `${nameInput}${preferredExt ?? ''}`
            : nameInput;
      if (!name) return;
      // 自动添加分类前缀（若用户未显式添加）
      const lower = name.toLowerCase();
      const needPrefix = !(lower.startsWith(prefix + '-') || lower.startsWith(prefix + '_'));
      if (needPrefix) {
        name = `${prefix}-${name}`;
      }
      try {
        const filePath = await storage.createFile(category, name, '');
        await metadata.updateFileMetadata(filePath);
        vscode.window.showInformationMessage(`已创建 ${name}`);
        provider.refresh();
        await fileOps.openFile(filePath);
      } catch (e: any) {
        vscode.window.showErrorMessage(`创建失败：${e?.message ?? e}`);
      }
    }),
    vscode.commands.registerCommand('aiRuleHub.deleteFile', async (node?: LibraryItem) => {
      if (!node || node.type !== 'file') {
        vscode.window.showWarningMessage('请在文件节点上使用“删除”');
        return;
      }
      if (node.path && !storage.isAIRuleHubFile(node.path)) {
        vscode.window.showErrorMessage('该文件不属于 AI Rule Hub 管理域，已阻止操作');
        return;
      }
      const confirm = await vscode.window.showWarningMessage(
        `删除文件 ${node.label}？`,
        '确认',
        '取消',
      );
      if (confirm !== '确认') return;
      try {
        const [category, filename] = node.id.split('/');
        await storage.deleteFile(category, filename);
        if (!node.path) {
          vscode.window.showErrorMessage('无法确定文件路径，删除元数据失败');
        } else {
          await metadata.removeFileMetadata(node.path);
        }
        vscode.window.showInformationMessage(`已删除 ${node.label}`);
        provider.refresh();
      } catch (e: any) {
        vscode.window.showErrorMessage(`删除失败：${e?.message ?? e}`);
      }
    }),
    vscode.commands.registerCommand('aiRuleHub.renameFile', async (node?: LibraryItem) => {
      if (!node || node.type !== 'file') {
        vscode.window.showWarningMessage('请在文件节点上使用“重命名”');
        return;
      }
      if (node.path && !storage.isAIRuleHubFile(node.path)) {
        vscode.window.showErrorMessage('该文件不属于 AI Rule Hub 管理域，已阻止操作');
        return;
      }
      const [category, filename] = node.id.split('/');
      const name = await vscode.window.showInputBox({
        prompt: `重命名 ${filename}`,
        value: filename,
      });
      if (!name || name === filename) return;
      try {
        const newPath = await storage.renameFile(category, filename, name);
        if (!node.path) {
          vscode.window.showErrorMessage('无法确定文件路径，更新元数据失败');
        } else {
          await metadata.renameFileMetadata(node.path, newPath);
        }
        vscode.window.showInformationMessage(`已重命名为 ${name}`);
        provider.refresh();
      } catch (e: any) {
        vscode.window.showErrorMessage(`重命名失败：${e?.message ?? e}`);
      }
    }),
    vscode.commands.registerCommand('aiRuleHub.setStoragePath', async () => {
      const uri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: '选择此文件夹作为存储路径',
      });
      const selected = uri?.[0]?.fsPath;
      if (!selected) return;

      try {
        // 更新配置并持久化
        config.storagePath = selected;
        await configManager.saveConfig(config);

        // 重新初始化存储与元数据，并刷新视图
        await storage.initialize(config);
        await metadata.initialize(config.storagePath);
        provider.refresh();

        vscode.window.showInformationMessage(`存储路径已设置为：${selected}`);
      } catch (e: any) {
        vscode.window.showErrorMessage(`设置存储路径失败：${e?.message ?? e}`);
      }
    }),
    vscode.commands.registerCommand('aiRuleHub.refreshLibrary', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.aiRuleHub');
      provider.refresh();
      vscode.window.showInformationMessage('已刷新文件库');
    }),
    vscode.commands.registerCommand('aiRuleHub.searchFiles', async () => {
      const query = await vscode.window.showInputBox({
        prompt: '输入搜索关键字（按文件名/类别路径匹配）',
      });
      provider.setFilter?.(query ?? '');
    }),
    vscode.commands.registerCommand('aiRuleHub.clearSearch', async () => {
      provider.setFilter?.('');
      vscode.window.showInformationMessage('已清空搜索过滤');
    }),
    vscode.commands.registerCommand('aiRuleHub.focusView', async () => {
      vscode.commands.executeCommand('workbench.view.extension.aiRuleHub');
    }),
  ];

  commands.forEach((c) => context.subscriptions.push(c));
}
