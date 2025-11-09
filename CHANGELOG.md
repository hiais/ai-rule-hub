# Changelog

本项目的所有显著变更都会记录在此文件中。

格式参考 Keep a Changelog，并遵循语义化版本。

## [Unreleased]

- 文档与发布流程进一步完善
- CI 工作流增强与测试覆盖率计划

## [0.1.0] - 2025-11-09

- 初始公开版本（MVP 骨架）
- VS Code 扩展：文件库、搜索过滤、基础文件操作
- 新增扩展发布元数据与 `.vscodeignore`
- 完善根/扩展 README，加入市场发布与安装指南
- 添加 GitHub Actions：CI 构建与按标签打包/发布

# Changelog

## 0.1.2 - 2025-11-09

- fix(storage): 创建 metadata 目录并顺序初始化避免 ENOENT
  - 在 `MetadataManager.initialize` 中确保 `metadata` 目录存在
  - 激活流程改为先初始化 `StorageManager`，再初始化 `MetadataManager`
