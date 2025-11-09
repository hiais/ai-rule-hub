# 发布与维护指南（AI Rule Hub）

面向维护者的完整流程与注意事项，覆盖 Git 推送、编译打包、发布配置、CI 自动发布、以及发布后验证与故障排查。

## 1. Git 与远程配置

- 检查远程：`git remote -v` 应显示 `origin https://github.com/hiais/ai-rule-hub.git`（或 SSH
  `git@github.com:hiais/ai-rule-hub.git`）。
- 同步分支：`git push origin master`
- 创建发布标签：
  - 对齐版本：确保 `extension/package.json` 的 `version` 与标签一致，例如 `0.1.1`。
  - 创建标签：`git tag -a v0.1.1 -m "Release 0.1.1"`
  - 推送标签：`git push origin v0.1.1`
- 如需重触发发布：
  - 删除远程标签：`git push origin :refs/tags/v0.1.1`
  - 重新推送：`git push origin v0.1.1`
- 网络受限排查：
  - 测试连通性：PowerShell `Test-NetConnection github.com -Port 443`
  - 可切换 SSH：生成密钥 `ssh-keygen -t ed25519 -C "<email>"` → 添加到 GitHub →
    `git remote set-url origin git@github.com:hiais/ai-rule-hub.git`

## 2. 编译与本地打包

- 进入扩展目录：`cd extension`
- 安装依赖：`npm ci`
- 编译：`npm run build`（输出到 `dist/`，入口 `main: ./dist/extension.js`）
- 打包 VSIX：`npm run package`（等价于 `npx vsce package`），受 `.vscodeignore` 控制打包内容
- 本地安装验证：在 VS Code 执行 `Extensions: Install from VSIX...` 选择生成的 `.vsix`

## 3. 发布配置（令牌与权限）

- GitHub Secrets（仓库级）：Settings → Secrets and variables → Actions
  - `VSCE_TOKEN`：来自 VS Marketplace 管理页，需具备 Publisher 权限。
    - 获取地址：`https://marketplace.visualstudio.com/manage`（登录后创建/查看 Token）
  - `OVSX_TOKEN`：来自 Open VSX 的用户设置，需具备 "Publish Extension" 权限。
    - 获取地址：`https://open-vsx.org/user-settings/tokens`（登录后创建/查看 Token）
- 校验要点：
  - 确认 Secrets 名称与工作流一致（`VSCE_TOKEN`、`OVSX_TOKEN`）。
  - Token 未过期、权限正确、与发布者账号匹配（Publisher：`hiais`）。
  - Secrets 设置为仓库范围；组织级 Secrets 亦可，但需被该仓库引用。

## 4. 发布到市场

- 手动发布（VSCE）：
  - 进入 `extension/`：`npm ci && npm run build`
  - 本地打包：`npx vsce package`
  - 发布到 VS Marketplace：`npx vsce publish -p <VSCE_TOKEN>`
  - 发布到 Open VSX（可选）：`npm i -g ovsx && ovsx publish extension/*.vsix -p <OVSX_TOKEN>`

- 通过 CI（推荐）：
  - 推送标签：`git push origin v0.1.1`
  - 工作流：`/.github/workflows/release.yml`
    - 触发条件：`push` 标签 `v*`；支持 `workflow_dispatch` 手动触发
    - 步骤：Checkout → Setup Node 20 → `npm ci`（根与 `extension/`）→ `npm run build`（extension）→
      `npx vsce package --no-dependencies` → 上传 Artifact
      → 条件发布（检测到 Secrets 则发布 VSCE/OVSX）

## 5. 发布后验证

- GitHub Actions：
  - 仓库页 `Actions` 查看 `Release` 工作流运行状态（`queued` / `in progress` / `succeeded`）
  - 下载构建产物 Artifact（`.vsix`），可用于本地安装验证
- VS Marketplace：
  - 扩展页应显示新版本号（如 `0.1.1`）与发布日期
  - 扩展的 `publisher` 为 `hiais`，扩展名 `ai-rule-hub`
- Open VSX（如配置）：
  - 扩展页面显示新版本；可通过 `ovsx` CLI 或网站确认
- 本地调试：
  - 在 `extension/` 使用 VS Code `Run Extension`（F5）调试扩展激活与视图/命令行为
  - 常用脚本：`npm run watch`（增量编译）、`npm run lint`（代码质量）

## 6. 常见问题与排查

- 工作流未触发：
  - 标签命名是否以 `v` 开头（如 `v0.1.1`）
  - 工作流是否在默认分支存在并最新（已推送到 `master`）
  - 曾在 Secrets 未配置前推送过同名标签：需删除远程标签并重新推送
- 发布失败：
  - 检查 `VSCE_TOKEN` / `OVSX_TOKEN` 是否存在、权限是否正确、是否过期
  - VSCE 发布者是否为 `hiais` 且扩展 `publisher` 字段一致
  - 网络连通：`github.com:443`、`marketplace.visualstudio.com`、`open-vsx.org`
- 打包失败：
  - 运行 `npm ci` 确保依赖完整
  - 检查 `.vscodeignore` 是否误排除了必要文件（保留
    `dist/`、`resources/`、`README.md`、`CHANGELOG.md`、`LICENSE`）

## 7. 版本与文档维护

- 版本号：更新 `extension/package.json` 的 `version`，示例 `0.1.1`
- 变更记录：在根 `CHANGELOG.md` 添加对应版本条目
- 提交：`git add -A && git commit -m "chore: release X.Y.Z"`
- 标签：`git tag -a vX.Y.Z -m "Release X.Y.Z" && git push origin vX.Y.Z`

---

提示：本指南与以下文档配套使用：

- 根 `README.md`（仓库结构、快速索引、CI/CD 概览）
- `extension/README.md`（扩展使用与维护者快速说明）
- `/.github/workflows/release.yml`（自动发布工作流）
