# 贡献指南

感谢你对 AI Rule Hub 的关注与贡献！

## 开发流程

- Fork 仓库并创建特性分支：`feat/<short-name>` 或 `fix/<short-name>`。
- 保持变更原子，遵循项目规则 `docs/rules.md` 与架构 `docs/architecture.md`。
- 运行本地校验：`npm run lint`、`npm run format:check`（在根），扩展在 `extension/` 目录构建。
- 提交信息建议使用约定式提交：`type(scope): subject`。
- 提交 PR 时附带变更说明与影响范围，关联 Issue（如有）。

## 扩展开发

- 进入 `extension/`：`npm i && npm run build`。
- 打包验证：`npx vsce package`，检查生成的 `.vsix`。
- 不要修改运行时行为以外的文档/元数据，除非与发布相关。

## 代码风格

- TypeScript 严格模式，ESLint 与 Prettier 已配置。
- 命名与目录结构参考 `docs/rules.md`。

## 发布与版本

- 在准备发布前更新 `CHANGELOG.md` 与 `extension/package.json` 的 `version`。
- 使用标签 `vX.Y.Z` 触发 CI 发布流程。

## 沟通与讨论

- 问题与建议请通过 GitHub Issues 提交。
- 行为准则参见 `CODE_OF_CONDUCT.md`。
