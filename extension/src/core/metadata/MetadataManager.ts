import fs from 'node:fs/promises';
import path from 'node:path';
import type { FileMetadata } from '../../types';

export class MetadataManager {
  private metaFile!: string;

  async initialize(basePath: string): Promise<void> {
    this.metaFile = path.join(basePath, 'metadata', 'file-meta.json');
    try {
      await fs.access(this.metaFile);
    } catch {
      await fs.writeFile(this.metaFile, JSON.stringify({ files: [] }, null, 2), 'utf8');
    }
  }

  async loadMetadata(): Promise<{ files: FileMetadata[] }> {
    const buf = await fs.readFile(this.metaFile, 'utf8');
    return JSON.parse(buf);
  }

  async saveMetadata(metadata: { files: FileMetadata[] }): Promise<void> {
    await fs.writeFile(this.metaFile, JSON.stringify(metadata, null, 2), 'utf8');
  }

  async updateFileMetadata(filePath: string): Promise<void> {
    const meta = await this.loadMetadata();
    const stat = await fs.stat(filePath).catch(() => undefined);
    const size = stat?.size ?? 0;
    const now = Date.now();
    const idx = meta.files.findIndex((f) => f.path === filePath);
    if (idx >= 0) {
      // 保留既有字段（如 usedCount、lastUsedAt），仅更新尺寸与更新时间
      meta.files[idx] = { ...meta.files[idx], size, updatedAt: now };
    } else {
      // 新建记录时初始化使用次数为 0
      meta.files.push({ path: filePath, size, createdAt: now, updatedAt: now, usedCount: 0 });
    }
    await this.saveMetadata(meta);
  }

  async recordFileUsage(filePath: string): Promise<void> {
    const meta = await this.loadMetadata();
    const now = Date.now();
    const idx = meta.files.findIndex((f) => f.path === filePath);
    if (idx >= 0) {
      const prev = meta.files[idx]?.usedCount ?? 0;
      meta.files[idx] = { ...meta.files[idx], lastUsedAt: now, usedCount: prev + 1 };
    } else {
      // 如果不存在，创建基础记录
      meta.files.push({
        path: filePath,
        size: 0,
        createdAt: now,
        updatedAt: now,
        lastUsedAt: now,
        usedCount: 1,
      });
    }
    await this.saveMetadata(meta);
  }

  async removeFileMetadata(filePath: string): Promise<void> {
    const meta = await this.loadMetadata();
    const next = meta.files.filter((f) => f.path !== filePath);
    await this.saveMetadata({ files: next });
  }

  async renameFileMetadata(oldPath: string, newPath: string): Promise<void> {
    const meta = await this.loadMetadata();
    const idx = meta.files.findIndex((f) => f.path === oldPath);
    if (idx >= 0) {
      meta.files[idx] = { ...meta.files[idx], path: newPath, updatedAt: Date.now() };
      await this.saveMetadata(meta);
    }
  }
}
