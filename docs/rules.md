# 项目规则（统一规范）

本规则来源于 `draft.md` 的 MVP 设计理念：极简、实用、零学习成本。用于指导持续开发并保持一致性。

## 1. 范式与目标

- 极简优先：功能以“必要且充足”为准，不做过度设计。
- 用户体验优先：遵循 VS Code 原生交互习惯，保持直观一致。
- 一致性优先：统一代码风格、命名、目录结构与提交流程。

## 2. 技术栈与工程约束

- 语言：TypeScript（`strict` 模式）。
- 运行环境：VS Code 扩展（Node.js 环境 + VS Code API）。
- 依赖建议：`fs-extra`、`ajv`（配置校验）、`globby`（文件枚举，按需）。
- 构建：`npm scripts` + `vsce` 发布（后续可接入 CI）。

## 3. 目录结构（建议）

```
root/
├── draft.md                 # 设计源文档（参考）
├── README.md                # 仓库索引与指南
├── docs/
│   ├── rules.md             # 统一项目规则（本文件）
│   └── architecture.md      # 项目架构说明
├── .editorconfig            # 编辑器统一风格
└── .vscode/
    └── settings.json        # VS Code 工作区配置
```

扩展实现阶段建议：

```
extension/
├── package.json             # VS Code 扩展元数据
├── src/
│   ├── core/                # 核心模块（单一职责）
│   │   ├── storage/         # StorageManager
│   │   ├── config/          # ConfigManager
│   │   ├── metadata/        # MetadataManager
│   │   └── files/           # FileOperations
│   ├── ui/                  # ContentLibraryProvider + 视图层
│   ├── commands/            # 命令注册与实现
│   ├── types/               # 类型定义（HubConfig、FileMetadata 等）
│   ├── utils/               # 工具函数（日志、错误处理等）
│   └── extension.ts         # 激活入口
└── test/                    # 单元测试
```

## 4. 命名规范

- 目录/文件：`kebab-case`（示例：`content-library-provider.ts`）。
- 类/类型：`PascalCase`（示例：`StorageManager`、`FileMetadata`）。
- 变量/函数：`camelCase`，函数动词开头（`openFile`、`insertFileContent`）。
- 常量：全大写 + 下划线（`DEFAULT_STORAGE_PATH`）。
- 命令 ID：命名空间前缀 + 动作（`aiRuleHub.openFile`）。

## 5. 代码风格

- 缩进 2 空格、`LF` 换行、`UTF-8` 编码（见 `.editorconfig`）。
- 单文件职责清晰，避免“上帝类”。
- 公共类型和接口放置 `src/types/`，避免循环依赖。
- 抛错优先返回 `Result` 风格或使用明确的错误类型；扩展层统一捕获并提示。

## 6. 提交规范（Conventional Commits）

格式：`<type>(<scope>): <subject>`

- `feat`：新增功能
- `fix`：问题修复
- `docs`：文档更新
- `style`：代码风格（不影响逻辑）
- `refactor`：重构（不含修复/新功能）
- `perf`：性能优化
- `test`：测试相关
- `build`：构建或依赖
- `ci`：CI 配置
- `chore`：其他事务

Scope 建议：`storage`、`config`、`metadata`、`files`、`ui`、`commands`、`types`、`utils`、`release`。

## 7. 分支策略（极简）

- 主分支：`main`（稳定可发布）。
- 特性分支：`feat/<short-name>`；修复分支：`fix/<short-name>`。
- 小步快跑：PR 小而频、可快速回滚；禁止长期堆积。

## 8. 版本与发布

- 版本遵循 `SemVer`；扩展 `package.json` 的 `version` 与 Git Tag 对齐。
- 发布使用 `vsce`；变更记录以 PR/Release Notes 归档。

## 9. 错误处理与用户反馈

- 统一错误出口：`showErrorMessage`；成功使用 `showInformationMessage`。
- 耗时操作使用进度指示器（`withProgress`）。
- 错误信息明确且带有修复建议；不可恢复错误提示重试与回退选项。

## 10. 日志与可观测性

- 使用 `OutputChannel` 输出关键日志：操作起止、错误栈、配置加载结果。
- 日志分级：`info`、`warn`、`error`；避免在正常路径打印冗余日志。

## 11. 配置管理

- `HubConfig` 必须校验（`ajv`），不合法时回退默认配置并提示。
- 默认配置内置于 `ConfigManager`，允许用户覆盖但不允许删除必需字段。

## 12. 测试策略（MVP）

- 单元测试优先：`StorageManager`、`ConfigManager` 行为与边界。
- 文件系统相关测试使用临时目录隔离；避免污染真实环境。
- UI 与命令行为可用轻量模拟，后续补充集成测试。

## 13. 文档与变更记录

- 所有新增/变更模块需更新 `docs/architecture.md` 与本规则涉及部分。
- 在 `README.md` 保持入口索引与简要使用说明同步。

## 14. UX 交互规则

- 侧边栏交互遵循设计文档：单击打开、右键菜单、搜索实时过滤。
- 插入内容保持原文件缩进与格式，不更改编码与行尾符。
- 搜索仅匹配文件名与路径，保持轻量与响应。

## 15. 性能与健壮性

- 文件枚举与读取需异步并批量控制；避免阻塞 UI。
- 元数据与文件分离，提升操作性能，减少编辑干扰。
- 对未知文件类型与损坏元数据采取“安全默认值 + 自动重建”。

## 16. 安全与权限

- 存储路径访问失败需明确提示并引导修复。
- 插件不擅自修改用户项目目录结构；数据集中存储于用户配置路径。

## 17. 文件分类与扩展支持

- 支持类型与后缀遵循设计文档；识别新增类型时需扩展配置与图标映射。

—

以上规则在 MVP 范围内稳定执行，后续扩展功能需在不破坏现有体验的前提下逐步引入。

