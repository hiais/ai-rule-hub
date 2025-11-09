# 行为快捷词（一键提效最小集 · 三条）

> 复制以下短句到 Cursor /
> Trae 对话中即可执行。为避免“选项太多”，仅保留 3 条覆盖：规范提交、本地打包、CI 发布。默认在仓库根目录执行，Windows/PowerShell 环境即可。

## 使用方式

- 直接复制某条快捷词到对话中；如需定制，追加少量参数（分支/标签/版本）。
- 每条执行后，要求返回：关键日志要点、VSIX 路径（如适用）、市场链接（如适用）、失败步骤与原因。

## 快捷词（三条核心）

1. 规范提交（git 记录）

- 快捷词：`规范提交（git 记录）`
- 行为：
  - 扫描变更并按需运行自动格式修复（如存在配置）：`prettier --write`、`eslint --fix`（或调用已配置的
    `npm run fmt/lint`）。
  - 根据变更自动生成约定式提交信息（类型与 scope 由变更目录推断，如
    `docs`/`extension`/`ci`/`release` 等）。
  - 执行 `git add -A && git commit -m "<auto message>"`；如无变更则提示“无文件变化”。
  - 可选：`git push` 到当前分支；如网络或权限异常，返回简明排查建议。

  - 约定式提交规范（Conventional Commits）：
    - 消息格式：`<type>(<scope>)!: <subject>`；可选的 `!` 或在 body/footer 写 `BREAKING CHANGE:`
      表示破坏性更新。
    - 常用类型：`feat`（新功能）、`fix`（问题修复）、`docs`（文档）、`style`（格式/不影响逻辑）、`refactor`（重构）、`perf`（性能优化）、`test`（测试）、`build`（构建系统/依赖）、`ci`（持续集成）、`chore`（杂项/维护）、`revert`（回退）。
    - scope 示例：`extension`、`docs`、`core`、`ui`、`types`、`commands`、`config`、`ci`、`release`
      等；多模块可省略或使用 `multi`。
    - subject：一句话动词原形，清晰描述变更；中文/英文均可，避免冗长。
    - body（可选）：补充动机、影响范围、迁移指引/风险；按点分行。
    - footer（可选）：引用问题或任务，如 `Closes #123`、`Refs #456`；破坏性更新用 `BREAKING CHANGE:`
      说明。
    - 示例：
      - `feat(extension): 支持搜索规则并高亮匹配`
      - `fix(core): 修复规则解析在空文件报错`
      - `docs: 更新发布流程与常见错误处理`
      - `refactor(ui): 抽离列表项组件以提升可维护性`
      - `perf: 缓存规则索引，降低冷启动耗时`
      - `revert: 回退 feat(extension): 支持批量导入`

  - 注意：
    - 保持一次提交聚焦一个意图；大改动分批次提交更易审阅。
    - 与自动生成信息冲突时，允许手工覆盖，但需保留 `type/scope` 语义一致性。

2. 本地打包并输出 VSIX 路径（清理旧 VSIX）

- 快捷词：`本地打包并输出 VSIX 路径`
- 行为：在 `extension/` 执行 `npm ci && npm run build && npx vsce package`，先清理旧的
  `extension/*.vsix`，打包完成后动态解析并打印最新 VSIX 的完整路径；失败则返回错误摘要与修复建议。

3. CI 发布（合并其他发布相关）

- 快捷词：`CI 发布`
- 行为：
  - 推送当前分支最新代码（如需要）；读取 `extension/package.json` 的 `version`
    生成并推送标签触发 Release。
  - 工作流中：安装 `ovsx`，动态解析 VSIX 路径，尝试创建 Open VSX 命名空间（若不存在），并在检测到
    `VSCE_TOKEN/OVSX_TOKEN` 时自动发布。
  - 完成后返回：构建产物 VSIX 下载链接、VS Marketplace 与 Open VSX 的版本页面链接（如适用）。
  - 若需重触发：支持删除并重推同名标签；返回重触发的结果摘要。

## 可选参数（按需追加）

- 指定分支：在 `master` 之外的分支执行并推标签，例如“分支为 `release/0.1.x`”。
- 指定标签：使用自定义标签，例如“创建并推送 `v0.1.1-r6`”。
- 指定版本：若与 `package.json` 不一致，说明理由并更新后再发布。

## 期望输出格式（建议）

- 关键信息：所执行的主要命令与结果摘要。
- 产物路径：VSIX 完整路径（如：`extension/<publisher>.<name>-<version>.vsix`）。
- 市场链接：VS Marketplace 与 Open VSX 的版本页面（如适用）。
- 故障定位：失败步骤的原始日志片段与原因简述。

## 小贴士

- 首次发布到 Open VSX 需要命名空间与“Publish Extension”令牌权限。
- “VSCE already exists” 属于信息提示，不影响后续 Open VSX 发布。
- 为避免 `ENOENT`，发布前务必进行“VSIX 路径与元数据诊断”（CI 发布已内置动态解析）。
