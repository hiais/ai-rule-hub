import fs from 'node:fs/promises';
import path from 'node:path';
import type * as vscode from 'vscode';
import type { Dirent } from 'node:fs';
import type { HubConfig } from '../../types';
import { StorageManager } from '../storage/StorageManager';
import { MetadataManager } from '../metadata/MetadataManager';

export class StarterInstaller {
  async installFromResources(
    context: vscode.ExtensionContext,
    config: HubConfig,
    storage: StorageManager,
    metadata: MetadataManager,
  ): Promise<void> {
    const categories = Object.entries(config.categories)
      .filter(([, v]) => v.enabled)
      .map(([key]) => key);

    for (const cat of categories) {
      const srcDir = context.asAbsolutePath(path.join('resources', 'starter', cat));
      const exts = storage.getAllowedExtensions(cat);
      const entries = await this.safeReadDir(srcDir);

      for (const ent of entries) {
        if (!ent.isFile()) continue;
        const name = ent.name;
        const allowed =
          exts.length === 0 || exts.some((ext) => name.toLowerCase().endsWith(ext.toLowerCase()));
        if (!allowed) continue;

        const srcPath = path.join(srcDir, name);
        const destPath = storage.resolveFilePath(cat, name);

        const exists = await this.pathExists(destPath);
        if (exists) continue; // 不覆盖已有文件

        try {
          const buf = await fs.readFile(srcPath);
          await fs.writeFile(destPath, buf);
          await metadata.updateFileMetadata(destPath);
        } catch {
          // 单文件失败不影响整体安装
        }
      }
    }
  }

  private async safeReadDir(dir: string): Promise<Dirent[]> {
    try {
      return await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return [];
    }
  }

  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.stat(p);
      return true;
    } catch {
      return false;
    }
  }
}
