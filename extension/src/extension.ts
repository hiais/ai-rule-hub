import * as vscode from 'vscode';
import { ConfigManager } from './config/ConfigManager';
import { StorageManager } from './core/storage/StorageManager';
import { MetadataManager } from './core/metadata/MetadataManager';
import { ContentLibraryProvider } from './ui/ContentLibraryProvider';
import { SearchViewProvider } from './ui/SearchViewProvider';
import { registerCommands } from './commands/register';
import { FileOperations } from './core/files/FileOperations';
import { StarterInstaller } from './core/startup/StarterInstaller';

export async function activate(context: vscode.ExtensionContext) {
  const configManager = new ConfigManager();
  const config = await configManager.loadConfig();

  const storage = new StorageManager();
  const metadata = new MetadataManager();
  // 依次初始化以避免并发竞态造成的目录缺失问题
  await storage.initialize(config);
  await metadata.initialize(config.storagePath);
  // 从资源目录安装 starter：仅复制缺失文件，避免覆盖用户修改
  try {
    await new StarterInstaller().installFromResources(context, config, storage, metadata);
  } catch {}

  const provider = new ContentLibraryProvider(config, storage, metadata);
  const tree = vscode.window.createTreeView('aiRuleHub.view', { treeDataProvider: provider });
  context.subscriptions.push(tree);

  // 注册搜索 Webview 视图（嵌入输入框）
  const searchProvider = new SearchViewProvider(provider);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(SearchViewProvider.viewId, searchProvider),
  );

  const fileOps = new FileOperations();
  registerCommands(context, fileOps, storage, provider, metadata, configManager, config, tree);
}

export function deactivate() {}
