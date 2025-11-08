import * as vscode from 'vscode';
import { ConfigManager } from './config/ConfigManager';
import { StorageManager } from './core/storage/StorageManager';
import { MetadataManager } from './core/metadata/MetadataManager';
import { ContentLibraryProvider } from './ui/ContentLibraryProvider';
import { registerCommands } from './commands/register';
import { FileOperations } from './core/files/FileOperations';

export async function activate(context: vscode.ExtensionContext) {
  const configManager = new ConfigManager();
  const config = await configManager.loadConfig();

  const storage = new StorageManager();
  await storage.initialize(config);

  const metadata = new MetadataManager();
  await metadata.initialize(config.storagePath);

  const provider = new ContentLibraryProvider(config, storage);
  const tree = vscode.window.createTreeView('aiRuleHub.view', { treeDataProvider: provider });
  context.subscriptions.push(tree);

  const fileOps = new FileOperations();
  registerCommands(context, fileOps, storage, provider, metadata);
}

export function deactivate() {}
