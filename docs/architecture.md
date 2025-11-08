# 项目架构说明

基于 `draft.md` 的系统设计，本文定义模块职责、数据模型、目录结构与关键流程，作为持续开发的架构参考。

## 1. 总览

AI Rule Hub 是一个 VS Code 扩展，用于统一管理 AI 编程规则与提示词，支持跨项目共享。核心由以下模块构成：

- StorageManager：统一存储与文件系统操作
- ConfigManager：扩展配置加载与校验
- MetadataManager：文件元数据维护与使用记录
- FileOperations：面向编辑器的文件操作封装
- ContentLibraryProvider：侧边栏树数据提供与刷新
- Commands：命令注册与行为绑定

## 2. 模块职责

### StorageManager

- 初始化存储系统与基础路径；确保目录结构存在。
- 提供标准化文件 CRUD 接口；解析类别路径与文件后缀。
- 判断路径是否属于 Rule Hub 管理域（安全边界）。

### ConfigManager

- 加载与保存 `HubConfig`；提供默认配置与版本字段。
- 使用 `ajv` 校验配置合法性，失败时回退默认并提示。
- 暴露启用的分类与后缀映射，用于 UI 与存储模块。

### MetadataManager

- 维护 `metadata/file-meta.json`：文件大小、哈希、最近使用时间等。
- 读写元数据与更新使用记录；异常时自动重建元数据文件。

### FileOperations

- 基于 VS Code API 执行：打开文件、插入内容、创建、删除、重命名等。
- 插入内容保持原格式与缩进，不修改编码与行尾符。

### ContentLibraryProvider

- 实现 `TreeDataProvider`：构建分类与文件树节点。
- 监听配置与存储变化，支持 `refresh()` 主动刷新视图。
- 提供上下文菜单命令与图标映射。

### Commands

- 命令 ID 与功能：
  - `aiRuleHub.openFile`、`aiRuleHub.insertFile`、`aiRuleHub.createFile`、`aiRuleHub.deleteFile`、`aiRuleHub.renameFile`
  - `aiRuleHub.setStoragePath`、`aiRuleHub.refreshLibrary`、`aiRuleHub.searchFiles`、`aiRuleHub.focusView`
- 在 `extension.ts` 激活中统一注册，解耦具体实现与 UI。

## 3. 数据模型

### HubConfig（示例）

```ts
type HubConfig = {
  version: string;
  storagePath: string;
  categories: Record<string, {
    enabled: boolean;
    fileExtensions: string[];
  }>;
  features: {
    autoRefresh: boolean;
    showFileCounts: boolean;
    enableSearch: boolean;
  };
};
```

### FileMetadata（示例）

```ts
type FileMetadata = {
  path: string;
  size: number;
  hash?: string;
  lastUsedAt?: number;
  createdAt?: number;
  updatedAt?: number;
};
```

## 4. 目录结构（扩展实现）

```
extension/
├── package.json
├── src/
│   ├── core/
│   │   ├── storage/
│   │   ├── config/
│   │   ├── metadata/
│   │   └── files/
│   ├── ui/
│   ├── commands/
│   ├── types/
│   ├── utils/
│   └── extension.ts
└── test/
```

## 5. 关键流程（文字版）

### 首次设置流程

```
扩展激活 → 引导设置库路径 → 创建目录结构 → 写入默认配置与元数据 → 视图就绪
```

### 文件管理流程

```
侧边栏树显示 → 点击文件在编辑器打开 → 保存后更新元数据 → 手动或自动刷新视图
```

### 快速插入流程

```
当前活动编辑器定位 → 右键选择“插入到光标位置” → 读取源文件内容 → 按目标文件缩进插入 → 成功提示
```

### 搜索过滤流程

```
用户输入关键字 → 前端实时过滤分类与文件名（不读内容） → 显示结果 → 选择操作
```

## 6. 错误处理与反馈

- 统一错误出口：`showErrorMessage`；成功提示用 `showInformationMessage`。
- 进度展示：`withProgress` 包裹耗时操作，避免 UI 卡顿。
- 元数据损坏：自动重建 + 保留用户文件数据；记录日志并提示。

## 7. 性能与资源

- 异步文件 IO 与批量限制，避免阻塞主线程。
- 缓存分类与文件列表；必要时引入轻量索引以降低磁盘扫描频率。
- 图标与计数在 `autoRefresh` 开启时谨慎更新，避免过度渲染。

## 8. 依赖与工具建议

- `fs-extra`：文件操作增强。
- `ajv`：JSON 配置校验。
- `globby`：基于后缀的文件枚举（可选）。
- `vitest/jest`：单元测试框架。

## 9. 构建与发布

- 使用 `npm run build` 编译 TypeScript；`vsce publish` 发布扩展。
- Release Notes 关联 PR 与变更类型，遵循约定式提交汇总。

## 10. 可扩展性

- 新分类与文件类型：扩展 `HubConfig` 的 `categories` 映射与 UI 图标。
- 插件间协作：后续可提供 API 暴露存储与查询功能。
- 团队数据：未来引入同步/备份/协作功能时，保持与本架构解耦。
