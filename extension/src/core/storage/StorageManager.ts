import fs from 'node:fs/promises';
import path from 'node:path';
import type { HubConfig } from '../../types';

export class StorageManager {
  private basePath!: string;
  private config!: HubConfig;

  async initialize(config: HubConfig): Promise<void> {
    this.config = config;
    this.basePath = config.storagePath;
    await this.ensureDirectoryStructure();
  }

  private async ensureDirectoryStructure(): Promise<void> {
    const categories = Object.keys(this.config.categories);
    for (const cat of categories) {
      const dir = path.join(this.basePath, 'categories', cat);
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.mkdir(path.join(this.basePath, 'metadata'), { recursive: true });
  }

  resolveFilePath(category: string, filename: string): string {
    return path.join(this.basePath, 'categories', category, filename);
  }

  isAIRuleHubFile(filePath: string): boolean {
    return path.normalize(filePath).startsWith(path.normalize(this.basePath));
  }

  async listFiles(category: string): Promise<string[]> {
    const dir = path.join(this.basePath, 'categories', category);
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const exts = this.config.categories[category]?.fileExtensions ?? [];
      return entries
        .filter((e) => e.isFile())
        .map((e) => e.name)
        .filter((name) => exts.length === 0 || exts.some((ext) => name.endsWith(ext)));
    } catch {
      return [];
    }
  }

  getAllowedExtensions(category: string): string[] {
    return this.config.categories[category]?.fileExtensions ?? [];
  }

  async createFile(category: string, filename: string, content = ''): Promise<string> {
    const filePath = this.resolveFilePath(category, filename);
    await fs.writeFile(filePath, content, { encoding: 'utf8' });
    return filePath;
  }

  async deleteFile(category: string, filename: string): Promise<void> {
    const filePath = this.resolveFilePath(category, filename);
    await fs.unlink(filePath);
  }

  async renameFile(category: string, oldName: string, newName: string): Promise<string> {
    const oldPath = this.resolveFilePath(category, oldName);
    const newPath = this.resolveFilePath(category, newName);
    await fs.rename(oldPath, newPath);
    return newPath;
  }
}
