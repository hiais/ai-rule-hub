# AI Rule Hub

统一管理 AI 编程规则与提示词的项目与 VS Code 扩展。

[![GitHub Release](https://img.shields.io/github/v/release/hiais/ai-rule-hub?display_name=tag)](https://github.com/hiais/ai-rule-hub/releases)
[![CI](https://github.com/hiais/ai-rule-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/hiais/ai-rule-hub/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

## 快速入口

复制以下短句到 Cursor/Trae 对话即可一键执行；详细说明见 `docs/prompts.md`。

- `规范提交（git 记录)`
- `本地打包并输出 VSIX 路径`
- `CI 发布`

## 快速索引

- 项目规则: `docs/rules.md`
- 项目架构: `docs/architecture.md`
- 快捷词（一键提效最小集）: `docs/prompts.md`
- 工作区配置: `.editorconfig`

## 项目简介

AI Rule
Hub 旨在统一管理 AI 编程规则与提示词（规则、Prompts、MCP 配置、Agent 描述、工作流程），以极简、实用、零学习成本为核心设计理念，支持跨项目共享使用。

## 如何使用

- 在 VS Code 中打开扩展视图，执行 `设置存储路径` 选择库目录（默认 `~/.ai-rule-hub`）。
- 在分类节点上使用 `新建文件`，或点击文件在编辑器中打开与编辑。
- 通过 `搜索文件` 命令输入关键字，按“类别/文件名”进行前端过滤（不搜索内容）。
- 通过 `刷新文件库` 命令手动更新侧边栏数据；所有文件操作后会主动刷新列表。
- 阅读并遵循 `docs/rules.md` 的统一规范与提交流程；参考 `docs/architecture.md`
  的模块职责与目录结构进行扩展。

## 仓库结构

- `extension/`：VS Code 扩展源码与发布文件
- `docs/`：架构与统一规则文档
- `preview/`：简单预览服务示例（与扩展无强耦合）
- 根配置与工具：`eslint.config.js`、`.editorconfig`、`.prettierrc.json`

## 推送到 GitHub

- 初始化远程仓库并设置 `origin`：
  - 创建仓库：`https://github.com/<org>/ai-rule-hub`
  - 将本地推送：`git remote add origin <repo-url>`，`git push -u origin master`
- 建议开启 `Actions`，使用本仓库的 CI 配置进行构建与发布。

## 扩展发布（VS Marketplace）

- 在 `extension/` 目录使用 `vsce` 打包与发布：
  - 打包：`npx vsce package`
  - 发布：`npx vsce publish -p <VSCE_TOKEN>`（需要已注册的发布者与令牌）
- 发布清单：`extension/package.json` 已包含 `publisher`、`engines`、`icon`、`repository`、`keywords`
  等主流字段。
- 打包优化：通过 `extension/.vscodeignore` 排除开发文件，仅包含
  `dist/`、`resources/`、`README.md`、`CHANGELOG.md`、`LICENSE`。

## CI/CD 与自动发布

- `/.github/workflows/ci.yml`：推送/PR 触发构建与 lint。
- `/.github/workflows/release.yml`：推送 `v*` 标签自动打包；在设置 `VSCE_TOKEN` 后自动发布至市场。
- 发布与维护的完整步骤见 `docs/publishing.md`（包含 Git 推送、令牌权限配置、CI 触发与失败排查）。

## 版本与变更记录

- 遵循 [语义化版本](https://semver.org/lang/zh-CN/)；发布前更新 `CHANGELOG.md`。
- 初始版本：`0.1.0`（MVP 骨架）。

## 贡献与安全

- 参阅 `CONTRIBUTING.md` 了解开发与提交规范。
- 安全问题请按 `SECURITY.md` 指引通过私有渠道报告。

## 许可证

- 详见 `LICENSE`（MIT）。

## 持续交付建议

- 使用约定式提交与短周期 Feature 分支，保持代码变更原子与易回滚。
- 路线图推进时遵循“极简”策略：不做文件系统自动监听与复杂 UI，仅保留必要功能与手动刷新。

## 参考

- 设计文档: `draft.md`
