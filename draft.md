# AI Rule Hub - 完整设计文档

## 📋 文档概述

**项目名称**: AI Rule Hub **版本**: v1.0 MVP **设计理念**: 极简、实用、零学习成本
**核心价值**: 统一管理AI编程规则和提示词，跨项目共享使用

---

## 🎯 产品愿景

### 核心价值主张

**"一个地方管理所有AI编程规则，处处使用"**

### 解决的问题

- AI编程规则、提示词、配置分散在不同项目和位置
- 团队间难以共享和统一规范
- 重复创建相似的规则和提示词
- 缺乏统一的版本管理和备份

### 目标用户

- 个人开发者：希望在不同项目间复用AI编程规范
- 团队技术负责人：需要统一团队的AI编程标准
- DevOps工程师：管理公司级的AI开发规范

---

## 📁 系统架构

### 存储结构

```
~/.ai-rule-hub/                    # 根目录 (可配置)
├── hub-config.json               # 插件配置文件
├── categories/                   # 分类目录
│   ├── rules/                   # 规则
│   ├── prompts/                 # 提示词
│   ├── mcp/                     # MCP配置
│   ├── agent/                   # 智能体描述
│   └── workflows/               # 工作流程
└── metadata/                     # 元数据
    └── file-meta.json           # 文件元数据
```

### 支持的文件类型

| 分类       | 文件后缀                | 说明                       |
| ---------- | ----------------------- | -------------------------- |
| 规则       | `.rule`, `.rule.md`     | 通用规则文件               |
| 提示词     | `.prompt.md`, `.prompt` | AI提示词模板               |
| MCP配置    | `.mcp.json`             | Model Context Protocol配置 |
| 智能体描述 | `.agent.md`             | AI智能体角色描述           |
| 工作流程   | `.workflow.md`          | 开发工作流程文档           |

---

## 🎨 用户界面设计

### 侧边栏布局

```
AI Rule Hub
├── ⚙️ 设置库路径
├── 🔍 [搜索文件...]
├── 📁 rules (3)
├── 📁 prompts (12)
├── 📁 mcp (2)
├── 📁 agent (5)
└── 📁 workflows (3)
```

### 视觉设计原则

- **极简主义**: 只显示必要信息
- **一致性**: 遵循VS Code设计规范
- **直观性**: 图标和文字清晰表达功能
- **响应式**: 适配不同主题和字体设置

### 图标系统

- 📁 文件夹
- 📄 普通文件
- 🛜 规则文件
- 💬 提示词文件
- ⚙️ MCP配置文件
- 🤖 智能体描述文件
- 📋 工作流程文件

---

## 🔄 核心功能流程

### 1. 首次设置流程

```
用户安装插件 → 显示设置引导 → 选择存储路径 → 创建目录结构 → 准备就绪
```

### 2. 文件管理流程

```
侧边栏显示文件树 → 用户点击文件 → VS Code打开编辑 → 用户保存 → 更新元数据
```

### 3. 快速插入流程

```
用户在编辑器工作 → 需要规则/提示词 → 侧边栏找到文件 → 右键插入 → 内容插入光标位置
```

### 4. 搜索过滤流程

```
用户在搜索框输入 → 实时过滤文件列表 → 显示匹配结果 → 用户选择操作
```

---

## 🛠️ 技术实现方案

### 1. 核心类设计

#### StorageManager - 存储管理

```typescript
class StorageManager {
  private basePath: string;

  // 初始化存储系统
  async initialize(storagePath?: string): Promise<void>;

  // 确保目录结构
  private async ensureDirectoryStructure(): Promise<void>;

  // 文件操作
  async saveFile(category: string, filename: string, content: string): Promise<string>;
  async readFile(category: string, filename: string): Promise<string>;
  async deleteFile(category: string, filename: string): Promise<void>;
  async listFiles(category: string): Promise<string[]>;

  // 路径解析
  resolveFilePath(category: string, filename: string): string;
  isAIRuleHubFile(filePath: string): boolean;
}
```

#### ContentLibraryProvider - 侧边栏数据

```typescript
class ContentLibraryProvider implements vscode.TreeDataProvider<LibraryItem> {
  // TreeDataProvider实现
  getTreeItem(element: LibraryItem): vscode.TreeItem;
  getChildren(element?: LibraryItem): Thenable<LibraryItem[]>;

  // 数据获取
  private getCategories(): Promise<LibraryItem[]>;
  private getFilesInCategory(categoryPath: string): Promise<LibraryItem[]>;

  // 刷新
  refresh(): void;
}
```

#### FileOperations - 文件操作

```typescript
class FileOperations {
  // 打开文件编辑
  async openFile(filePath: string): Promise<void>;

  // 插入文件内容到当前编辑器
  async insertFileContent(filePath: string): Promise<void>;

  // 创建新文件
  async createFile(category: string, filename: string): Promise<string>;

  // 删除文件
  async deleteFile(filePath: string): Promise<void>;

  // 重命名文件
  async renameFile(oldPath: string, newName: string): Promise<string>;
}
```

#### MetadataManager - 元数据管理

```typescript
class MetadataManager {
  // 加载元数据
  async loadMetadata(): Promise<FileMetadata>;

  // 保存元数据
  async saveMetadata(metadata: FileMetadata): Promise<void>;

  // 更新文件元数据
  async updateFileMetadata(filePath: string, content: string): Promise<void>;

  // 记录文件使用
  async recordFileUsage(filePath: string): Promise<void>;

  // 删除文件元数据
  async removeFileMetadata(filePath: string): Promise<void>;
}
```

### 2. 配置管理

#### 配置文件结构

```json
{
  "version": "1.0.0",
  "storagePath": "/Users/username/.ai-rule-hub",
  "categories": {
    "rules": {
      "enabled": true,
      "fileExtensions": [".rule", ".rule.md"]
    },
    "prompts": {
      "enabled": true,
      "fileExtensions": [".prompt.md", ".prompt"]
    }
  },
  "features": {
    "autoRefresh": true,
    "showFileCounts": true,
    "enableSearch": true
  }
}
```

#### 配置管理器

```typescript
class ConfigManager {
  // 加载配置
  async loadConfig(): Promise<HubConfig>;

  // 保存配置
  async saveConfig(config: HubConfig): Promise<void>;

  // 获取默认配置
  private getDefaultConfig(): HubConfig;

  // 验证配置
  private validateConfig(config: HubConfig): boolean;
}
```

### 3. 命令系统

#### 注册的命令

```typescript
const COMMANDS = {
  // 文件操作
  'aiRuleHub.openFile': '打开文件进行编辑',
  'aiRuleHub.insertFile': '插入文件内容到光标位置',
  'aiRuleHub.createFile': '创建新文件',
  'aiRuleHub.deleteFile': '删除文件',
  'aiRuleHub.renameFile': '重命名文件',

  // 库管理
  'aiRuleHub.setStoragePath': '设置存储路径',
  'aiRuleHub.refreshLibrary': '刷新文件库',
  'aiRuleHub.searchFiles': '搜索文件',

  // 视图控制
  'aiRuleHub.focusView': '聚焦到AI Rule Hub视图',
};
```

---

## 📱 用户交互细节

### 1. 侧边栏交互

#### 文件树操作

- **单击文件**: 在编辑器打开文件
- **右键文件**: 显示上下文菜单
- **右键文件夹**: 显示"新建文件"选项
- **搜索框**: 实时过滤文件列表

#### 上下文菜单

**文件右键菜单**:

- 打开文件
- 插入到光标位置
- 在文件管理器中显示
- 重命名
- 删除
- 复制路径

**文件夹右键菜单**:

- 新建文件
- 在文件管理器中打开
- 刷新

### 2. 编辑体验

#### 文件打开

- 使用VS Code原生编辑器打开
- 在主编辑区域显示
- 支持所有VS Code编辑功能
- 语法高亮根据文件类型自动启用

#### 内容插入

- 插入到当前活动编辑器的光标位置
- 保持原文件格式和缩进
- 不修改目标文件的编码和行尾符

### 3. 搜索功能

#### 搜索逻辑

- 实时搜索，输入即触发
- 搜索文件名和路径
- 不搜索文件内容（保持简单）
- 支持中文拼音首字母搜索

#### 搜索界面

```
搜索: [api]                ← 用户输入

📄 api-design.rule
📄 openapi-generation.prompt.md
📄 restful-api.workflow.md
```

---

## 🔧 安装和配置

### 首次安装流程

1. 用户通过VS Code扩展市场安装
1. 插件自动激活，侧边栏显示AI Rule Hub
1. 用户点击"设置库路径"选择存储位置
1. 系统创建目录结构，准备使用

### 配置选项

- **存储路径**: 规则库的存储位置（默认: `~/.ai-rule-hub`）
- **文件分类**: 启用/禁用特定文件分类
- **显示设置**: 控制侧边栏显示选项

### 数据迁移

- 支持从旧版本迁移数据
- 支持导入外部规则文件
- 导出功能用于备份和分享

---

## 🚀 MVP功能范围

### 包含的功能 (v1.0)

- ✅ 侧边栏文件树显示
- ✅ 基础文件操作（打开、插入、新建、删除、重命名）
- ✅ 文件搜索过滤
- ✅ 跨项目共享存储
- ✅ 基础元数据管理
- ✅ 配置文件管理

### 排除的功能 (后续版本)

- ❌ 文件内容模板
- ❌ 复杂分类系统
- ❌ 自动同步和备份
- ❌ 团队协作功能
- ❌ 使用统计分析
- ❌ 导入导出功能

---

## 📈 开发路线图

### Phase 1: 核心功能 (2周)

- 存储系统和配置管理
- 侧边栏基础文件树
- 基础文件操作（打开、插入）

### Phase 2: 文件管理 (1周)

- 完整文件操作（新建、删除、重命名）
- 搜索过滤功能
- 右键菜单完善

### Phase 3: 体验优化 (1周)

- 错误处理和用户反馈
- 性能优化
- 文档和测试

---

## 🐛 错误处理和边界情况

### 常见错误场景

1. **存储路径不可访问**
   - 提示用户选择新路径
   - 提供修复指导

1. **文件操作失败**
   - 显示具体错误信息
   - 提供重试选项

1. **元数据损坏**
   - 自动重建元数据
   - 保留用户文件数据

### 用户反馈机制

- 操作成功/失败的清晰提示
- 进度指示器对于耗时操作
- 详细的错误信息和解决建议

---

## 💡 设计决策说明

### 1. 为什么使用独立存储路径？

- 确保跨项目一致性
- 避免污染项目文件结构
- 简化备份和迁移

### 2. 为什么复用VS Code编辑器？

- 零学习成本，用户熟悉操作
- 充分利用现有编辑功能
- 减少插件复杂度

### 3. 为什么不做模板功能？

- 保持极简设计理念
- 用户更了解自己的需求
- 避免过度设计和复杂度

### 4. 为什么元数据与文件分离？

- 提高文件操作性能
- 避免修改用户文件
- 支持快速搜索和统计

---

## 🔮 未来扩展可能性

### 功能扩展

- 文件版本管理
- 团队协作和分享
- 使用习惯分析
- 智能推荐

### 集成扩展

- 与Cursor深度集成
- 与其他AI编程工具集成
- CI/CD流水线集成

---

## 📞 技术支持

### 问题排查指南

- 检查存储路径权限
- 验证配置文件完整性
- 查看VS Code开发者控制台

### 用户支持

- 详细的README文档
- 常见问题解答
- GitHub Issues支持

---

**文档版本**: 1.0 **最后更新**: 2024-01-20 **维护者**: AI Rule Hub开发团队

这个设计文档提供了完整的开发参考，聚焦核心功能，避免过度设计，确保MVP能够快速交付并解决用户的核心痛点。
