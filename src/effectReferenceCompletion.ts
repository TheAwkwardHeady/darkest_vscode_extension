import * as vscode from "vscode";

const EFFECT_REFERENCE_PARAMETER = /\.(effect|effects|[A-Za-z0-9_]+_effects)\s+(?:"([^"]*)|([^\s"]*))$/;
const EFFECT_ID = /^\s*effect:\s*.*?\.name\s+"([^"]+)"/gm;
export const effectReferenceOutput = vscode.window.createOutputChannel("Darkest Effect References");

export class EffectReferenceCompletionProvider implements vscode.CompletionItemProvider {
  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.CompletionItem[] | undefined> {
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.slice(0, position.character);
    const reference = EFFECT_REFERENCE_PARAMETER.exec(beforeCursor);
    effectReferenceOutput.appendLine(
      `Request: ${document.uri.fsPath}:${position.line + 1}:${position.character + 1} | ${line.trim()}`
    );
    if (!reference) {
      effectReferenceOutput.appendLine("Skipped: cursor is not after a supported effect-reference parameter value.");
      return undefined;
    }
    const parameter = reference[1];
    effectReferenceOutput.appendLine(`Matched parameter .${parameter}; scanning workspace effect files.`);

    const ids = new Set<string>();
    let files: vscode.Uri[];
    try {
      files = await vscode.workspace.findFiles(
        "**/*effects*",
        "**/{node_modules,.git}/**",
        1000
      );
    } catch (error) {
      effectReferenceOutput.appendLine(`Workspace search failed: ${String(error)}`);
      return [];
    }
    effectReferenceOutput.appendLine(`Found ${files.length} candidate file(s): ${files.map(file => file.fsPath).join(", ") || "(none)"}`);
    for (const file of files) {
      const effectDocument = file.toString() === document.uri.toString()
        ? document
        : await vscode.workspace.openTextDocument(file);
      const contents = effectDocument.getText();
      EFFECT_ID.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = EFFECT_ID.exec(contents)) !== null) ids.add(match[1]);
    }

    const prefix = reference[2] ?? reference[3] ?? "";
    const matchedIds = [...ids].filter(id => id.toLowerCase().startsWith(prefix.toLowerCase()));
    effectReferenceOutput.appendLine(`Extracted ${ids.size} unique ID(s); prefix "${prefix}" matched ${matchedIds.length}.`);
    const start = position.translate(0, -prefix.length);
    return matchedIds
      .sort((a, b) => a.localeCompare(b))
      .map(id => {
        const item = new vscode.CompletionItem(id, vscode.CompletionItemKind.Reference);
        item.detail = "Effect ID from an effects file in this workspace";
        item.range = new vscode.Range(start, position);
        return item;
      });
  }
}
