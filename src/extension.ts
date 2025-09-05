import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let copyAllOpenedTabs = vscode.commands.registerCommand('extension.copyAllOpenedTabsAsMarkdown', copyAllOpenedTabsAsMarkdown);
    let copyCode = vscode.commands.registerCommand('extension.copyCodeAsMarkdown', copyCodeAsMarkdown);
    let copyFile = vscode.commands.registerCommand('extension.copyFileAsMarkdown', (uri: vscode.Uri, uris: vscode.Uri[]) => copyFileAsMarkdown(uri, uris));

    context.subscriptions.push(copyAllOpenedTabs, copyCode, copyFile);
}

async function copyAllOpenedTabsAsMarkdown() {
    const project = vscode.workspace.workspaceFolders?.[0];
    if (!project) return;

    const allOpenFiles = vscode.workspace.textDocuments.filter(doc => doc.uri.scheme === 'file');

    if (allOpenFiles.length === 0) return;

    let allFilesMarkdown = `Project Name: ${project.name}\n\n`;

    for (const file of allOpenFiles) {
        if (isImageFile(file.fileName)) {
            const safeFileName = escapeMarkdown(path.basename(file.fileName));
            allFilesMarkdown += `![Image: ${safeFileName}](${getRelativePath(project, file.uri)})\n\n`;
            continue;
        }

        const content = file.getText();
        allFilesMarkdown += `## File: ${getRelativePath(project, file.uri)}\n\n`;
        allFilesMarkdown += `\`\`\`${file.languageId}\n${content}\n\`\`\`\n\n`;
    }

    await vscode.env.clipboard.writeText(allFilesMarkdown);
    vscode.window.showInformationMessage('All opened tabs copied as Markdown');
}

async function copyCodeAsMarkdown() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText) return;

    const project = vscode.workspace.workspaceFolders?.[0];
    if (!project) return;

    const relativePath = getRelativePath(project, editor.document.uri);
    const fileExtension = path.extname(editor.document.fileName).slice(1);

    // 获取选中文本的起始和结束行号
    const startLine = selection.start.line + 1; // VSCode 行号从0开始，所以加1
    const endLine = selection.end.line + 1;

    let markdownBuilder = "\n";
    markdownBuilder += `# Project Name: ${project.name}\n\n`;
    markdownBuilder += `## File: ${relativePath} `;
    markdownBuilder += `Lines ${startLine}-${endLine}\n\n`; // 添加行号信息
    markdownBuilder += `\`\`\`${fileExtension}\n${selectedText}\n\`\`\``;

    await vscode.env.clipboard.writeText(markdownBuilder);
    vscode.window.showInformationMessage(`Selected code (lines ${startLine}-${endLine}) copied as Markdown`);
}

async function copyFileAsMarkdown(uri: vscode.Uri | undefined, uris: vscode.Uri[] | undefined) {
    const project = vscode.workspace.workspaceFolders?.[0];
    if (!project) return;

    let files: vscode.Uri[] = [];
    if (uris && uris.length > 0) {
        // 多文件选择情况
        files = uris;
    } else if (uri) {
        // 单文件选择情况
        files = [uri];
    } else if (vscode.window.activeTextEditor) {
        // 当前活动编辑器情况
        files = [vscode.window.activeTextEditor.document.uri];
    }

    if (files.length === 0) return;

    let markdown = `Project Name: ${project.name}\n\n`;

    for (const file of files) {
        const relativePath = getRelativePath(project, file);

        // 检查是否为目录
        if (fs.statSync(file.fsPath).isDirectory()) {
            markdown += `## Directory: ${relativePath}/\n\n`;
            // 递归列出目录中的文件
            const filesInDir = getFilesInDirectory(file.fsPath, project.uri.fsPath);
            if (filesInDir.length > 0) {
                markdown += `Files in this directory:\n`;
                for (const fileInDir of filesInDir) {
                    markdown += `- ${fileInDir}\n`;
                }
                markdown += `\n`;
            }
            continue;
        }

        if (isImageFile(file.fsPath)) {
            const safeFileName = escapeMarkdown(path.basename(file.fsPath));
            markdown += `![Image: ${safeFileName}](${relativePath})\n\n`;
            continue;
        }

        const document = await vscode.workspace.openTextDocument(file);
        const content = document.getText();
        markdown += `## File: ${relativePath}\n\n`;
        markdown += `\`\`\`${document.languageId}\n${content}\n\`\`\`\n\n`;
    }

    await vscode.env.clipboard.writeText(markdown);
    vscode.window.showInformationMessage(`${files.length} file(s) copied as Markdown`);
}

function isImageFile(filePath: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];
    return imageExtensions.includes(path.extname(filePath).toLowerCase());
}

function escapeMarkdown(text: string): string {
    return text.replace(/([[\]()\\])/g, '\\$1');
}

function getRelativePath(project: vscode.WorkspaceFolder, file: vscode.Uri): string {
    return path.relative(project.uri.fsPath, file.fsPath).replace(/\\/g, '/');
}

function getFilesInDirectory(dirPath: string, projectRoot: string): string[] {
    const files: string[] = [];
    const excludeDirs = ['node_modules', '.git', '.vscode', 'out', 'dist', 'build', 'vendor'];

    function traverseDirectory(currentPath: string, relativeBase: string) {
        try {
            const items = fs.readdirSync(currentPath);

            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const relativePath = path.join(relativeBase, item).replace(/\\/g, '/');

                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // 排除不需要的目录
                    if (!excludeDirs.includes(item)) {
                        traverseDirectory(fullPath, relativePath);
                    }
                } else {
                    // 只添加文件，不添加目录
                    files.push(relativePath);
                }
            }
        } catch (error) {
            // 忽略访问权限错误等
            console.warn(`Could not read directory: ${currentPath}`);
        }
    }

    const relativeDir = path.relative(projectRoot, dirPath).replace(/\\/g, '/');
    traverseDirectory(dirPath, relativeDir);

    return files;
}

export function deactivate() {}