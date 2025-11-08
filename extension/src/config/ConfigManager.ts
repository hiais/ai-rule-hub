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
        rules: {
          enabled: true,
          fileExtensions: ['.rule', '.rule.md'],
        },
        prompts: {
          enabled: true,
          fileExtensions: ['.prompt.md', '.prompt'],
        },
        mcp: {
          enabled: true,
          fileExtensions: ['.mcp.json'],
        },
        agent: {
          enabled: true,
          fileExtensions: ['.agent.md'],
        },
        workflows: {
          enabled: true,
          fileExtensions: ['.workflow.md'],
        },
      },
      features: {
        autoRefresh: true,
        showFileCounts: true,
        enableSearch: true,
      },
    };
  }
}
