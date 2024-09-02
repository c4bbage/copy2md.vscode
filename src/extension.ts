import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.copyAsMarkdown', async () => {
        const editor = vscode.window.activeTextEditor;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        let markdownContent = '';

        if (editor && editor.selection) {
            // 选中代码的情况
            const document = editor.document;
            const selection = editor.selection;
            const selectedText = document.getText(selection);
            const filePath = vscode.workspace.asRelativePath(document.uri);

            markdownContent = generateMarkdownForSelection(workspaceFolder.name, filePath, selectedText);
        } else {
            // 选中文件或文件夹的情况
            const selectedItems = vscode.window.activeTextEditor
                ? [vscode.window.activeTextEditor.document.uri]
                : vscode.window.visibleTextEditors.map(editor => editor.document.uri);

            if (selectedItems.length === 0) {
                const explorerSelection = await vscode.window.showOpenDialog({
                    canSelectMany: true,
                    openLabel: 'Select',
                    canSelectFiles: true,
                    canSelectFolders: true
                });

                if (explorerSelection) {
                    selectedItems.push(...explorerSelection);
                }
            }

            if (selectedItems.length > 0) {
                markdownContent = await generateMarkdownForFiles(workspaceFolder, selectedItems);
            }
        }

        if (markdownContent) {
            await vscode.env.clipboard.writeText(markdownContent);
            vscode.window.showInformationMessage('Content copied to clipboard as Markdown');
        } else {
            vscode.window.showWarningMessage('No content to copy');
        }
    });

    context.subscriptions.push(disposable);
}

function generateMarkdownForSelection(projectName: string, filePath: string, selectedText: string): string {
    return `## Project: ${projectName}
File: ${filePath}

\`\`\`
${selectedText}
\`\`\`
`;
}

async function generateMarkdownForFiles(workspaceFolder: vscode.WorkspaceFolder, uris: vscode.Uri[]): Promise<string> {
    let markdownContent = `## Project: ${workspaceFolder.name}\n\n`;

    for (const uri of uris) {
        const filePath = vscode.workspace.asRelativePath(uri);
        const stat = await vscode.workspace.fs.stat(uri);

        if (stat.type === vscode.FileType.Directory) {
            markdownContent += await processDirectory(uri, filePath);
        } else if (stat.type === vscode.FileType.File) {
            markdownContent += await processFile(uri, filePath);
        }
    }

    return markdownContent;
}

async function processDirectory(uri: vscode.Uri, directoryPath: string): Promise<string> {
    let content = `### Directory: ${directoryPath}\n\n`;
    const entries = await vscode.workspace.fs.readDirectory(uri);

    for (const [name, type] of entries) {
        const entryUri = vscode.Uri.joinPath(uri, name);
        const entryPath = path.join(directoryPath, name);

        if (type === vscode.FileType.Directory) {
            content += await processDirectory(entryUri, entryPath);
        } else if (type === vscode.FileType.File) {
            content += await processFile(entryUri, entryPath);
        }
    }

    return content;
}

async function processFile(uri: vscode.Uri, filePath: string): Promise<string> {
    if (isTextFile(filePath)) {
        const fileContent = await vscode.workspace.fs.readFile(uri);
        const text = new TextDecoder().decode(fileContent);

        return `#### File: ${filePath}

\`\`\`
${text}
\`\`\`

`;
    }
    return '';
}

function isTextFile(filePath: string): boolean {
    const textExtensions = ['.txt', '.md', '.js', '.ts', '.html', '.css', '.json', '.xml', '.yml', '.yaml', '.ini', '.conf', '.sh', '.bat', '.ps1', '.py', '.rb', '.php', '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.vb', '.sql'];
    const ext = path.extname(filePath).toLowerCase();
    return textExtensions.includes(ext);
}

export function deactivate() {}