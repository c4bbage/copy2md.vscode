# Change Log

All notable changes to the "copy2md" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.8] - 2025-10-28

### Fixed
- **Fixed "Copy Tabs → Markdown" copying all files**: Now correctly copies only the files that are actually open in editor tabs, not all files in workspace
- **Fixed folder selection errors**: Added proper error handling so selecting folders no longer throws errors. Folders now show directory name and file list gracefully
- Improved error handling when files cannot be read or accessed

## [0.0.7] - 2024-01-XX

### Fixed
- 修复选中文件夹时导致报错的问题
- 支持正确处理目录选择，显示目录结构而不读取文件内容
- 添加 'vendor' 目录到排除列表
- 改进混合选择（文件+文件夹）时的处理逻辑

## [Unreleased]

- Initial release