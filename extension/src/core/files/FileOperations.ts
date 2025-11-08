import * as vscode from 'vscode';

export class FileOperations {
  async openFile(filePath: string): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  async insertFileContent(filePath: string): Promise<void> {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('没有活动编辑器，无法插入内容');
      return;
    }
    await editor.edit((builder) => {
      builder.insert(editor.selection.active, doc.getText());
    });
  }
}
