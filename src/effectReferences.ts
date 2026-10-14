import * as vscode from "vscode";

interface EffectDefinition {
  name: string;
  uri: vscode.Uri;
  line: number;
  nameRange: vscode.Range;
  text: string;
}

interface EffectReference {
  name: string;
  range: vscode.Range;
}

const effectFilePattern = /\.effects\.darkest$/i;
const infoFilePattern = /\.info\.darkest$/i;
const referencePropertyPattern = /\.(effects|effect|[A-Za-z0-9_]+_effects)\b/g;
const namePropertyPattern = /\.name\s+("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s.]+)/g;

export function registerEffectReferenceFeatures(context: vscode.ExtensionContext): void {
  const diagnostics = vscode.languages.createDiagnosticCollection("darkest-effect-references");
  context.subscriptions.push(diagnostics);

  const definitions = new Map<string, EffectDefinition[]>();
  const indexedUris = new Set<string>();
  let indexReady = false;
  let updateQueue = Promise.resolve();

  const normalizeName = (name: string) => name.trim();
  const unquote = (value: string) => {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1).replace(/\\([\\"'])/g, "$1");
    }
    return trimmed;
  };

  function removeUri(uri: vscode.Uri): void {
    const key = uri.toString();
    indexedUris.delete(key);
    for (const [name, matches] of definitions) {
      const remaining = matches.filter(item => item.uri.toString() !== key);
      if (remaining.length) definitions.set(name, remaining);
      else definitions.delete(name);
    }
  }

  function addDocument(document: vscode.TextDocument): void {
    removeUri(document.uri);
    if (!effectFilePattern.test(document.uri.path)) return;
    indexedUris.add(document.uri.toString());
    for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
      const line = document.lineAt(lineNumber).text;
      const commentAt = line.indexOf("//");
      const searchable = commentAt >= 0 ? line.slice(0, commentAt) : line;
      namePropertyPattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = namePropertyPattern.exec(searchable)) !== null) {
        const name = normalizeName(unquote(match[1]));
        if (!name) continue;
        const valueOffset = match.index + match[0].lastIndexOf(match[1]);
        const start = valueOffset + (match[1].startsWith('"') || match[1].startsWith("'") ? 1 : 0);
        const end = valueOffset + match[1].length - (match[1].startsWith('"') || match[1].startsWith("'") ? 1 : 0);
        const item: EffectDefinition = {
          name,
          uri: document.uri,
          line: lineNumber,
          nameRange: new vscode.Range(lineNumber, start, lineNumber, end),
          text: line.trim(),
        };
        definitions.set(name, [...(definitions.get(name) ?? []), item]);
      }
    }
  }

  function referencesInLine(line: string, lineNumber: number): EffectReference[] {
    const commentAt = line.indexOf("//");
    const searchable = commentAt >= 0 ? line.slice(0, commentAt) : line;
    const references: EffectReference[] = [];
    referencePropertyPattern.lastIndex = 0;
    let property: RegExpExecArray | null;
    while ((property = referencePropertyPattern.exec(searchable)) !== null) {
      let cursor = property.index + property[0].length;
      while (cursor < searchable.length && /\s/.test(searchable[cursor])) cursor++;
      while (cursor < searchable.length) {
        while (cursor < searchable.length && /\s/.test(searchable[cursor])) cursor++;
        if (cursor >= searchable.length || searchable[cursor] === '.') break;
        const start = cursor;
        let value = "";
        let end = cursor;
        const quote = searchable[cursor] === '"' || searchable[cursor] === "'" ? searchable[cursor] : "";
        if (quote) {
          cursor++;
          let escaped = false;
          while (cursor < searchable.length) {
            const char = searchable[cursor++];
            if (escaped) { escaped = false; continue; }
            if (char === "\\") { escaped = true; continue; }
            if (char === quote) break;
          }
          end = cursor;
          value = unquote(searchable.slice(start, end));
        } else {
          while (cursor < searchable.length && !/\s/.test(searchable[cursor]) && searchable[cursor] !== '.') cursor++;
          end = cursor;
          value = searchable.slice(start, end);
        }
        if (!value) break;
        references.push({ name: value, range: new vscode.Range(lineNumber, start + (quote ? 1 : 0), lineNumber, end - (quote ? 1 : 0)) });
        if (cursor < searchable.length && searchable[cursor] === '.') break;
      }
    }
    return references;
  }

  function validateDocument(document: vscode.TextDocument): void {
    if (!infoFilePattern.test(document.uri.path)) {
      diagnostics.delete(document.uri);
      return;
    }
    const found: vscode.Diagnostic[] = [];
    for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
      for (const reference of referencesInLine(document.lineAt(lineNumber).text, lineNumber)) {
        const matches = definitions.get(reference.name) ?? [];
        if (matches.length === 0) {
          const diagnostic = new vscode.Diagnostic(reference.range, `No effect definition named "${reference.name}" was found in workspace *.effects.darkest files.`, vscode.DiagnosticSeverity.Warning);
          diagnostic.code = "missing-effect-definition";
          found.push(diagnostic);
        } else if (matches.length > 1) {
          const locations = matches.map(item => vscode.workspace.asRelativePath(item.uri) + `:${item.line + 1}`).join(", ");
          const diagnostic = new vscode.Diagnostic(reference.range, `Effect name "${reference.name}" is ambiguous; multiple definitions exist: ${locations}.`, vscode.DiagnosticSeverity.Warning);
          diagnostic.code = "ambiguous-effect-definition";
          found.push(diagnostic);
        }
      }
    }
    diagnostics.set(document.uri, found);
  }

  function refreshInfoDocuments(): void {
    for (const document of vscode.workspace.textDocuments) {
      if (infoFilePattern.test(document.uri.path)) validateDocument(document);
    }
  }

  async function indexWorkspace(): Promise<void> {
    const files = await vscode.workspace.findFiles("**/*.effects.darkest", "**/{.git,node_modules,.vscode}/**");
    definitions.clear();
    indexedUris.clear();
    for (const uri of files) {
      const openDocument = vscode.workspace.textDocuments.find(document => document.uri.toString() === uri.toString());
      if (openDocument) {
        addDocument(openDocument);
      } else {
        try {
          const bytes = await vscode.workspace.fs.readFile(uri);
          const text = Buffer.from(bytes).toString("utf8");
          indexText(uri, text);
        } catch { /* An unreadable effect file should not prevent the rest of the index from loading. */ }
      }
    }
    indexReady = true;
    refreshInfoDocuments();
  }

  function indexText(uri: vscode.Uri, text: string): void {
    const key = uri.toString();
    removeUri(uri);
    indexedUris.add(key);
    const lines = text.split(/\r?\n/);
    lines.forEach((line, lineNumber) => {
      const commentAt = line.indexOf("//");
      const searchable = commentAt >= 0 ? line.slice(0, commentAt) : line;
      namePropertyPattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = namePropertyPattern.exec(searchable)) !== null) {
        const name = normalizeName(unquote(match[1]));
        if (!name) continue;
        const valueOffset = match.index + match[0].lastIndexOf(match[1]);
        const quoted = match[1].startsWith('"') || match[1].startsWith("'");
        const item: EffectDefinition = { name, uri, line: lineNumber, nameRange: new vscode.Range(lineNumber, valueOffset + (quoted ? 1 : 0), lineNumber, valueOffset + match[1].length - (quoted ? 1 : 0)), text: line.trim() };
        definitions.set(name, [...(definitions.get(name) ?? []), item]);
      }
    });
  }

  async function updateEffectFile(uri: vscode.Uri): Promise<void> {
    if (!effectFilePattern.test(uri.path)) return;
    removeUri(uri);
    const openDocument = vscode.workspace.textDocuments.find(document => document.uri.toString() === uri.toString());
    if (openDocument) addDocument(openDocument);
    else {
      try { indexText(uri, Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8")); }
      catch { removeUri(uri); }
    }
    if (indexReady) refreshInfoDocuments();
  }

  context.subscriptions.push(
    vscode.languages.registerHoverProvider("darkest", {
      provideHover(document, position) {
        if (!infoFilePattern.test(document.uri.path)) return undefined;
        const reference = referencesInLine(document.lineAt(position.line).text, position.line).find(item => item.range.contains(position));
        if (!reference) return undefined;
        const matches = definitions.get(reference.name) ?? [];
        if (matches.length !== 1) return undefined;
        const definition = matches[0];
        const markdown = new vscode.MarkdownString();
        markdown.appendMarkdown(`**Effect: ${definition.name}**\n\n`);
        markdown.appendCodeblock(definition.text, "text");
        markdown.appendMarkdown(`\n[Open definition](${definition.uri.toString()}#${definition.line + 1})`);
        return new vscode.Hover(markdown, reference.range);
      },
    }),
    vscode.languages.registerDefinitionProvider("darkest", {
      provideDefinition(document, position) {
        if (!infoFilePattern.test(document.uri.path)) return undefined;
        const reference = referencesInLine(document.lineAt(position.line).text, position.line).find(item => item.range.contains(position));
        if (!reference) return undefined;
        const matches = definitions.get(reference.name) ?? [];
        if (matches.length !== 1) return undefined;
        const definition = matches[0];
        return new vscode.Location(definition.uri, definition.nameRange);
      },
    }),
  );

  const watcher = vscode.workspace.createFileSystemWatcher("**/*.effects.darkest");
  context.subscriptions.push(watcher,
    watcher.onDidCreate(uri => { updateQueue = updateQueue.then(() => updateEffectFile(uri)); }),
    watcher.onDidChange(uri => { updateQueue = updateQueue.then(() => updateEffectFile(uri)); }),
    watcher.onDidDelete(uri => { removeUri(uri); refreshInfoDocuments(); }),
    vscode.workspace.onDidOpenTextDocument(document => {
      if (effectFilePattern.test(document.uri.path)) { addDocument(document); if (indexReady) refreshInfoDocuments(); }
      else if (infoFilePattern.test(document.uri.path) && indexReady) validateDocument(document);
    }),
    vscode.workspace.onDidChangeTextDocument(event => {
      if (effectFilePattern.test(event.document.uri.path)) { addDocument(event.document); if (indexReady) refreshInfoDocuments(); }
      else if (infoFilePattern.test(event.document.uri.path) && indexReady) validateDocument(event.document);
    }),
    vscode.workspace.onDidCloseTextDocument(document => {
      if (effectFilePattern.test(document.uri.path)) { updateQueue = updateQueue.then(() => updateEffectFile(document.uri)); }
      if (infoFilePattern.test(document.uri.path)) diagnostics.delete(document.uri);
    }),
  );

  for (const document of vscode.workspace.textDocuments) {
    if (infoFilePattern.test(document.uri.path)) validateDocument(document);
  }
  updateQueue = updateQueue.then(indexWorkspace);
}
