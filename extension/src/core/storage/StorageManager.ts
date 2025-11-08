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

  private legacyAlias(category: string): string | undefined {
    const map: Record<string, string> = {
      rule: 'rules',
      prompt: 'prompts',
      workflow: 'workflows',
    };
    return map[category];
  }

  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.stat(p);
      return true;
    } catch {
      return false;
    }
  }

  async resolveFilePathFlexible(category: string, filename: string): Promise<string> {
    const primary = this.resolveFilePath(category, filename);
    if (await this.pathExists(primary)) return primary;
    const legacy = this.legacyAlias(category);
    if (legacy) {
      const alt = path.join(this.basePath, 'categories', legacy, filename);
      if (await this.pathExists(alt)) return alt;
    }
    return primary;
  }

  isAIRuleHubFile(filePath: string): boolean {
    // 更稳健的包含校验：使用 resolve + relative，避免同前缀路径误判（如 C:\hub 与 C:\hub-old）
    const base = path.resolve(this.basePath);
    const target = path.resolve(filePath);
    const rel = path.relative(base, target);
    // 注意：TS 中 `rel && ...` 会产生 `string | boolean`，需显式判断非空
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  }

  async listFiles(category: string): Promise<string[]> {
    const exts = this.config.categories[category]?.fileExtensions ?? [];
    const readDir = async (dir: string): Promise<string[]> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        return entries
          .filter((e) => e.isFile())
          .map((e) => e.name)
          .filter((name) => exts.length === 0 || exts.some((ext) => name.endsWith(ext)));
      } catch {
        return [];
      }
    };
    const primary = path.join(this.basePath, 'categories', category);
    const alias = this.legacyAlias(category);
    const legacy = alias ? path.join(this.basePath, 'categories', alias) : undefined;
    const a = await readDir(primary);
    const b = legacy ? await readDir(legacy) : [];
    // 去重合并
    return Array.from(new Set([...a, ...b]));
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
    const filePath = await this.resolveFilePathFlexible(category, filename);
    await fs.unlink(filePath);
  }

  async renameFile(category: string, oldName: string, newName: string): Promise<string> {
    const oldPath = await this.resolveFilePathFlexible(category, oldName);
    const newPath = this.resolveFilePath(category, newName);
    await fs.rename(oldPath, newPath);
    return newPath;
  }
}
