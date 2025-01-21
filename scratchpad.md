# Current Task
Implement three copy-to-markdown features in VSCode extension:
1. Copy Selection → Markdown
2. Copy File → Markdown
3. Copy All Opened Tabs → Markdown

## Analysis
The codebase already has all three features implemented:
- `copyCodeAsMarkdown()`: Handles copying selected code with proper formatting
- `copyFileAsMarkdown()`: Handles copying single/multiple files
- `copyAllOpenedTabsAsMarkdown()`: Handles copying all opened tabs

The implementation looks good and includes:
- Project name in output
- Proper code block formatting with language detection
- Image file handling
- Line number information for selections
- Multi-file support
- Relative path handling
- Markdown escaping

## Progress
[X] All three features are already implemented
[X] Features have proper command registration in package.json
[X] Features have proper menu integration
[X] Need to verify if any improvements needed

## Recent Fixes
[X] Added "Copy File → Markdown" to editor context menu
[X] Added "Copy All Opened Tabs" to editor context menu
[X] Updated all command titles to use consistent arrow (→) style:
    - "Copy Selection → Markdown"
    - "Copy File → Markdown"
    - "Copy Tabs → Markdown"
[X] Updated extension display name from "Copy2Markdown" to "copy2md"
[X] Updated README.md with:
    - Simplified description
    - Current feature names and functionality
    - Removed unnecessary sections
    - Added clear feature descriptions

## Lessons
- The extension uses proper VSCode extension patterns:
  - Command registration in package.json
  - Context menu integration
  - Proper handling of URIs and TextDocuments
  - Good error handling and user feedback
- Menu items need to be configured in both package.json and have corresponding command handlers
- Each menu context (editor/context, explorer/context) needs separate configuration
