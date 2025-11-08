import * as vscode from 'vscode';
import { FileOperations } from '../core/files/FileOperations';
import { StorageManager } from '../core/storage/StorageManager';
import { ContentLibraryProvider } from '../ui/ContentLibraryProvider';
import { MetadataManager } from '../core/metadata/MetadataManager';
import type { LibraryItem } from '../types';

export function registerCommands(
  context: vscode.ExtensionContext,
  fileOps: FileOperations,
  storage: StorageManager,
  provider: ContentLibraryProvider,
  metadata: MetadataManager,
) {
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
      if (!node || node.type !== 'category') {
        vscode.window.showWarningMessage('请在分类节点上使用“新建文件”');
        return;
      }
      const exts = storage.getAllowedExtensions(node.id);
      const place = exts.length > 0 ? `example${exts[0]}` : 'example.txt';
      const nameInput = await vscode.window.showInputBox({
        prompt: `在 ${node.label} 中新建文件`,
        placeHolder: place,
      });
      const name =
        !nameInput || nameInput.trim().length === 0
          ? undefined
          : exts.length > 0 && !exts.some((ext) => nameInput.endsWith(ext))
            ? `${nameInput}${exts[0]}`
            : nameInput;
      if (!name) return;
      try {
        const filePath = await storage.createFile(node.id, name, '');
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
      const confirm = await vscode.window.showWarningMessage(
        `删除文件 ${node.label}？`,
        '确认',
        '取消',
      );
      if (confirm !== '确认') return;
      try {
        const [category, filename] = node.id.split('/');
        await storage.deleteFile(category, filename);
        await metadata.removeFileMetadata(node.path!);
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
      const [category, filename] = node.id.split('/');
      const name = await vscode.window.showInputBox({
        prompt: `重命名 ${filename}`,
        value: filename,
      });
      if (!name || name === filename) return;
      try {
        const newPath = await storage.renameFile(category, filename, name);
        await metadata.renameFileMetadata(node.path!, newPath);
        vscode.window.showInformationMessage(`已重命名为 ${name}`);
        provider.refresh();
      } catch (e: any) {
        vscode.window.showErrorMessage(`重命名失败：${e?.message ?? e}`);
      }
    }),
    vscode.commands.registerCommand('aiRuleHub.setStoragePath', async () => {
      vscode.window.showInformationMessage('设置存储路径：MVP 骨架待完成功能');
    }),
    vscode.commands.registerCommand('aiRuleHub.refreshLibrary', async () => {
      vscode.commands.executeCommand('workbench.view.extension.aiRuleHub');
      vscode.window.showInformationMessage('刷新文件库');
    }),
    vscode.commands.registerCommand('aiRuleHub.searchFiles', async () => {
      const query = await vscode.window.showInputBox({
        prompt: '输入搜索关键字（按文件名/类别路径匹配）',
      });
      (provider as any).setFilter?.(query);
    }),
    vscode.commands.registerCommand('aiRuleHub.focusView', async () => {
      vscode.commands.executeCommand('workbench.view.extension.aiRuleHub');
    }),
  ];

  commands.forEach((c) => context.subscriptions.push(c));
}
