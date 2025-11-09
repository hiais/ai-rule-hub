import * as vscode from 'vscode';
import { ConfigManager } from './config/ConfigManager';
import { StorageManager } from './core/storage/StorageManager';
import { MetadataManager } from './core/metadata/MetadataManager';
import { ContentLibraryProvider } from './ui/ContentLibraryProvider';
import { SearchViewProvider } from './ui/SearchViewProvider';
import { registerCommands } from './commands/register';
import { FileOperations } from './core/files/FileOperations';

export async function activate(context: vscode.ExtensionContext) {
  const configManager = new ConfigManager();
  const config = await configManager.loadConfig();

  const storage = new StorageManager();
  const metadata = new MetadataManager();
  await Promise.all([storage.initialize(config), metadata.initialize(config.storagePath)]);

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
