# AI Rule Hub（VS Code 扩展）

统一管理 AI 编程规则与提示词的 VS Code 扩展。

[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/hiais.ai-rule-hub?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=hiais.ai-rule-hub)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/hiais.ai-rule-hub)](https://marketplace.visualstudio.com/items?itemName=hiais.ai-rule-hub)
[![GitHub Release](https://img.shields.io/github/v/release/hiais/ai-rule-hub?display_name=tag)](https://github.com/hiais/ai-rule-hub/releases)

## 功能

- 侧边栏文件库：按分类展示与操作规则文件
- 打开、插入、创建、删除、重命名
- 搜索过滤（按“类别/文件名”前端过滤）
- 使用频次与更新时间排序

## 安装

- 市场安装：在 VS Code 扩展市场搜索 `AI Rule Hub` 并安装。
- 本地安装：从 Release 下载 `.vsix`，在 VS Code 命令面板执行 `Extensions: Install from VSIX...`。

## 开发与构建

```bash
npm install
npm run build
npm run package
```

说明：

- 构建输出在 `dist/`（`main` 指向 `dist/extension.js`）。
- 打包使用 `vsce`，并通过 `.vscodeignore` 排除不需要的文件。

## 使用

- 在扩展视图中使用“设置存储路径”，选择规则库目录
- 在列表中右键执行相关操作
- 通过“搜索”视图筛选与分段选择分类

## 发布到市场（维护者）

前置准备：在 VSCE 注册发布者并获取令牌（`VSCE_TOKEN`）。

手动发布：

```bash
npx vsce package
npx vsce publish -p <VSCE_TOKEN>
```

CI 发布：推送 `v*` 标签触发工作流，自动打包并在存在 `VSCE_TOKEN` 时发布。

## Licenses

请参考仓库根目录 `LICENSE`（MIT）。
