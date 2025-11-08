import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { HubConfig } from '../types';

const CONFIG_FILE = 'hub-config.json';

export class ConfigManager {
  private configPath!: string;
  private config!: HubConfig;

  async loadConfig(storagePath?: string): Promise<HubConfig> {
    const base = storagePath || path.join(os.homedir(), '.ai-rule-hub');
    await fs.mkdir(base, { recursive: true });
    this.configPath = path.join(base, CONFIG_FILE);

    const defaultConfig = this.getDefaultConfig(base);
    try {
      const buf = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(buf);
      // 迁移旧复数分类键为单数：rules→rule，prompts→prompt，workflows→workflow
      const keyChanged = this.normalizeCategoryKeys(this.config);
      // 归一化后缀：移除包含类别关键字的后缀，只保留通用后缀
      const changed = this.normalizeExtensions(this.config);
      if (keyChanged || changed) {
        await this.saveConfig(this.config);
      }
      return this.config;
    } catch {
      this.config = defaultConfig;
      await this.saveConfig(this.config);
      return this.config;
    }
  }

  async saveConfig(config: HubConfig): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  getDefaultConfig(storagePath: string): HubConfig {
    return {
      version: '1.0.0',
      storagePath,
      categories: {
        rule: {
          enabled: true,
          // 统一方案：仅使用通用后缀，不再在后缀中携带类别关键字
          fileExtensions: ['.md'],
        },
        prompt: {
          enabled: true,
          fileExtensions: ['.md'],
        },
        mcp: {
          enabled: true,
          fileExtensions: ['.json'],
        },
        agent: {
          enabled: true,
          fileExtensions: ['.md'],
        },
        workflow: {
          enabled: true,
          fileExtensions: ['.md'],
        },
      },
      features: {
        autoRefresh: true,
        showFileCounts: true,
        enableSearch: true,
      },
    };
  }

  private normalizeExtensions(config: HubConfig): boolean {
    const before = JSON.stringify(config.categories);
    const desired: Record<string, string[]> = {
      rule: ['.md'],
      prompt: ['.md'],
      mcp: ['.json'],
      agent: ['.md'],
      workflow: ['.md'],
    };
    for (const [key, value] of Object.entries(config.categories)) {
      const want = desired[key] ?? value.fileExtensions ?? [];
      // 如果当前包含类别关键字的后缀，统一替换为通用后缀集合
      const hasCategoryTagged = (value.fileExtensions || []).some((ext) =>
        /\.(rule|prompt|agent|workflow|mcp)\.?/i.test(ext),
      );
      if (
        hasCategoryTagged ||
        JSON.stringify(value.fileExtensions || []) !== JSON.stringify(want)
      ) {
        config.categories[key].fileExtensions = want;
      }
    }
    const after = JSON.stringify(config.categories);
    return before !== after;
  }

  private normalizeCategoryKeys(config: HubConfig): boolean {
    const before = JSON.stringify(config.categories);
    const alias: Record<string, string> = {
      rules: 'rule',
      prompts: 'prompt',
      workflows: 'workflow',
    };
    for (const [oldKey, newKey] of Object.entries(alias)) {
      if (config.categories[oldKey] && !config.categories[newKey]) {
        config.categories[newKey] = config.categories[oldKey];
        delete config.categories[oldKey];
      }
    }
    const after = JSON.stringify(config.categories);
    return before !== after;
  }
}
