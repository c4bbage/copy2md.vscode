import * as vscode from 'vscode';
import * as path from 'path';

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
        if (isImageFile(file.fsPath)) {
            const safeFileName = escapeMarkdown(path.basename(file.fsPath));
            markdown += `![Image: ${safeFileName}](${getRelativePath(project, file)})\n\n`;
            continue;
        }

        const document = await vscode.workspace.openTextDocument(file);
        const content = document.getText();
        markdown += `## File: ${getRelativePath(project, file)}\n\n`;
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

export function deactivate() {}