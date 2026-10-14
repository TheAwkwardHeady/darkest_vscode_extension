import * as vscode from "vscode";

type EffectDefinition = {
  uri: vscode.Uri;
  range: vscode.Range;
  idRange: vscode.Range;
  attributes: Map<string, string>;
};
type BuffDefinition = {
  uri: vscode.Uri;
  range: vscode.Range;
  idRange: vscode.Range;
  fields: Record<string, unknown>;
};
type EffectReference = { id: string; range: vscode.Range; kind: "effect" | "buff" };
type ReferenceUse = { uri: vscode.Uri; range: vscode.Range };

const effectDefinitions = new Map<string, EffectDefinition>();
const buffDefinitions = new Map<string, BuffDefinition>();
const referenceUses = new Map<string, ReferenceUse[]>();
const output = vscode.window.createOutputChannel("Darkest Effect References");
const validDecoration = vscode.window.createTextEditorDecorationType({
  textDecoration: "underline",
});
const invalidDecoration = vscode.window.createTextEditorDecorationType({ color: "#F06A6A" });
const effectFilePattern = "**/*effects*";
const buffFilePattern = "**/*.buffs.json";
const excludedPattern = "**/{node_modules,.git}/**";

function referenceKey(kind: "effect" | "buff", id: string): string {
  return `${kind}:${id}`;
}

function isEffectReferenceParameter(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized === "effect" || normalized === "effects" || normalized.endsWith("_effects");
}

function isBuffReferenceParameter(name: string): boolean {
  return name.toLowerCase() === "buff_ids";
}

function isTrinketFile(uri: vscode.Uri): boolean {
  return uri.path.toLowerCase().endsWith(".entries.trinkets.json");
}

function parseReferences(line: string, lineNumber: number): EffectReference[] {
  const parameters: Array<{ name: string; start: number; valueStart: number }> = [];
  const parameterPattern = /\.([A-Za-z0-9_]+)\s+/g;
  let parameter: RegExpExecArray | null;
  while ((parameter = parameterPattern.exec(line)) !== null) {
    // Keep every parameter as a boundary so unrelated values (such as
    // .valid_modes) cannot be interpreted as effect IDs.
    parameters.push({ name: parameter[1], start: parameter.index, valueStart: parameterPattern.lastIndex });
  }

  const references: EffectReference[] = [];
  for (const [index, current] of parameters.entries()) {
    const kind = isEffectReferenceParameter(current.name)
      ? "effect"
      : isBuffReferenceParameter(current.name) ? "buff" : undefined;
    if (!kind) continue;
    const end = parameters[index + 1]?.start ?? line.length;
    const valueText = line.slice(current.valueStart, end);
    const valuePattern = /"([^"]+)"|([^\s.]+)/g;
    let value: RegExpExecArray | null;
    while ((value = valuePattern.exec(valueText)) !== null) {
      const id = value[1] ?? value[2];
      const relativeStart = value.index + (value[1] !== undefined ? 1 : 0);
      const start = current.valueStart + relativeStart;
      references.push({
        id,
        range: new vscode.Range(lineNumber, start, lineNumber, start + id.length),
        kind,
      });
    }
  }
  return references;
}

function parseTrinketReferences(document: vscode.TextDocument): EffectReference[] {
  const text = document.getText();
  const references: EffectReference[] = [];
  const propertyPattern = /"(buffs|[A-Za-z0-9_]*_additional_effects)"\s*:\s*\[/gi;
  let property: RegExpExecArray | null;
  while ((property = propertyPattern.exec(text)) !== null) {
    const arrayStart = propertyPattern.lastIndex;
    let depth = 1;
    let inString = false;
    let escaped = false;
    let arrayEnd = arrayStart;
    for (; arrayEnd < text.length; arrayEnd++) {
      const character = text[arrayEnd];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') inString = true;
      else if (character === "[") depth++;
      else if (character === "]" && --depth === 0) break;
    }
    const arrayText = text.slice(arrayStart, arrayEnd);
    const valuePattern = /"(?:\\.|[^"\\])*"/g;
    let value: RegExpExecArray | null;
    while ((value = valuePattern.exec(arrayText)) !== null) {
      let id: string;
      try { id = JSON.parse(value[0]) as string; } catch { continue; }
      if (!id) continue;
      const start = arrayStart + value.index + 1;
      references.push({
        id,
        range: new vscode.Range(document.positionAt(start), document.positionAt(start + value[0].length - 2)),
        kind: property[1].toLowerCase() === "buffs" ? "buff" : "effect",
      });
    }
    propertyPattern.lastIndex = arrayEnd + 1;
  }
  return references;
}

function parseDocumentReferences(document: vscode.TextDocument): EffectReference[] {
  if (isTrinketFile(document.uri)) return parseTrinketReferences(document);
  const references: EffectReference[] = [];
  for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
    references.push(...parseReferences(document.lineAt(lineNumber).text, lineNumber));
  }
  return references;
}

function parseEffectAttributes(line: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const matches: Array<{ name: string; valueStart: number; start: number }> = [];
  const parameterPattern = /(?:^|\s|")\.([A-Za-z_][A-Za-z0-9_]*)(?:\s+|(?=$))/g;
  let parameter: RegExpExecArray | null;
  while ((parameter = parameterPattern.exec(line)) !== null) {
    const dotOffset = parameter[0].indexOf(".");
    matches.push({
      name: parameter[1],
      start: parameter.index + dotOffset,
      valueStart: parameterPattern.lastIndex,
    });
  }
  for (const [index, current] of matches.entries()) {
    const end = matches[index + 1]?.start ?? line.length;
    const value = line.slice(current.valueStart, end).trim();
    const quotedValues = [...value.matchAll(/"([^"]*)"/g)].map(match => match[1]);
    const normalizedValue = quotedValues.length && value.replace(/"[^"]*"/g, "").trim() === ""
      ? quotedValues.join(", ")
      : value.replace(/^"([\s\S]*)"$/, "$1");
    attributes.set(current.name, normalizedValue);
  }
  return attributes;
}

function escapeInlineCode(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\n/g, " ");
}

function formatEffectHover(id: string, attributes: Map<string, string>): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString();
  const code = (value: string) => `\`${escapeInlineCode(value)}\``;
  const get = (name: string) => [...attributes].find(([key]) => key.toLowerCase() === name)?.[1];
  const definitionId = get("name") || id;
  markdown.appendMarkdown(`### ID ${code(definitionId)}\n\n`);

  const summary = [
    ["Target", get("target")],
    ["Chance", get("chance")],
    ["Duration", get("duration")],
  ].filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== "");
  if (summary.length) {
    markdown.appendMarkdown(summary.map(([label, value]) => `**${label}:** ${code(value)}`).join(" &nbsp; · &nbsp; ") + "\n\n");
  }

  const flags = ["instant_skill", "apply_with_result", "queue"]
    .filter(name => attributes.has(name))
    .map(name => `.${name}${get(name) ? ` ${code(get(name)!)}` : ""}`);
  if (flags.length) markdown.appendMarkdown(`**Triggers:** ${flags.join(" · ")}\n\n`);

  const buffIds = get("buff_ids");
  if (buffIds) {
    const links = buffIds.split(/,\s*/).map(value => {
      const buffId = value.trim();
      if (!buffId || !buffDefinitions.has(buffId)) return code(buffId);
      const command = `command:darkest.openBuffDefinition?${encodeURIComponent(JSON.stringify([buffId]))}`;
      return `[${code(buffId)}](${command})`;
    });
    markdown.appendMarkdown(`**Buff IDs:** ${links.join(" · ")}\n\n`);
  }

  const excluded = new Set([
    "name", "target", "chance", "duration", "instant_skill", "apply_with_result",
    "queue", "buff_ids",
  ]);
  const details = [...attributes].filter(([name, value]) => !excluded.has(name.toLowerCase()) && value !== "");
  if (details.length) {
    markdown.appendMarkdown("**Attributes:**\n\n");
    for (const [name, value] of details) markdown.appendMarkdown(`- .${name} ${code(value)}\n`);
    markdown.appendMarkdown("\n");
  }
  markdown.isTrusted = { enabledCommands: ["darkest.openBuffDefinition"] };
  return markdown;
}

function formatBuffHover(id: string, fields: Record<string, unknown>): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString();
  const code = (value: unknown) => `\`${escapeInlineCode(typeof value === "string" ? value : JSON.stringify(value))}\``;
  markdown.appendMarkdown(`### ID ${code(fields.id ?? id)}\n\n`);
  const statType = fields.stat_type;
  const subType = fields.stat_sub_type;
  if (statType !== undefined) {
    markdown.appendMarkdown(`**Stat:** ${code(statType)}${subType ? ` · ${code(subType)}` : ""}\n\n`);
  }
  if (fields.amount !== undefined) markdown.appendMarkdown(`**Amount:** ${code(fields.amount)}\n\n`);
  if (fields.duration !== undefined || fields.duration_type !== undefined) {
    const duration = [fields.duration_type, fields.duration].filter(value => value !== undefined).map(code);
    markdown.appendMarkdown(`**Duration:** ${duration.join(" · ")}\n\n`);
  }
  const summaryFields = new Set(["id", "stat_type", "stat_sub_type", "amount", "duration", "duration_type"]);
  const remaining = Object.entries(fields).filter(([name]) => !summaryFields.has(name));
  if (remaining.length) {
    markdown.appendMarkdown("**Attributes:**\n\n");
    for (const [name, value] of remaining) markdown.appendMarkdown(`- .${name} ${code(value)}\n`);
  }
  markdown.isTrusted = false;
  return markdown;
}

function isEffectFile(uri: vscode.Uri): boolean {
  return /(^|[\\/])effects([\\/]|\.|$)/i.test(uri.fsPath) || /effects/i.test(uri.path.split("/").pop() ?? "");
}

function isBuffFile(uri: vscode.Uri): boolean {
  return uri.path.toLowerCase().endsWith(".buffs.json");
}

function findJsonObjectBounds(text: string, propertyIndex: number): [number, number] | undefined {
  const start = text.lastIndexOf("{", propertyIndex);
  if (start < 0) return undefined;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth++;
    else if (character === "}" && --depth === 0) return [start, index + 1];
  }
  return undefined;
}

async function indexWorkspaceBuffs(): Promise<void> {
  try {
    const files = await vscode.workspace.findFiles(buffFilePattern, excludedPattern, 2000);
    const documents = new Map<string, vscode.TextDocument>();
    for (const file of files) documents.set(file.toString(), await vscode.workspace.openTextDocument(file));
    for (const document of vscode.workspace.textDocuments) {
      if (isBuffFile(document.uri)) documents.set(document.uri.toString(), document);
    }

    const nextDefinitions = new Map<string, BuffDefinition>();
    for (const document of documents.values()) {
      let parsed: { buffs?: unknown };
      try {
        parsed = JSON.parse(document.getText());
      } catch {
        output.appendLine(`Skipping invalid JSON while indexing buffs: ${document.uri.fsPath}`);
        continue;
      }
      if (!Array.isArray(parsed.buffs)) continue;
      const text = document.getText();
      const idPattern = /"id"\s*:\s*"([^"]+)"/g;
      let match: RegExpExecArray | null;
      while ((match = idPattern.exec(text)) !== null) {
        const fields = (parsed.buffs as Array<Record<string, unknown>>).find(buff => buff.id === match![1]);
        if (!fields || nextDefinitions.has(match[1])) continue;
        const bounds = findJsonObjectBounds(text, match.index);
        if (!bounds) continue;
        nextDefinitions.set(match[1], {
          uri: document.uri,
          range: new vscode.Range(document.positionAt(bounds[0]), document.positionAt(bounds[1])),
          idRange: new vscode.Range(
            document.positionAt(match.index + match[0].indexOf(match[1])),
            document.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length),
          ),
          fields,
        });
      }
    }

    buffDefinitions.clear();
    for (const [id, definition] of nextDefinitions) buffDefinitions.set(id, definition);
    output.appendLine(`Indexed ${buffDefinitions.size} buff ID(s) from ${documents.size} file(s).`);
    updateVisibleEditors();
    void indexWorkspaceUses();
  } catch (error) {
    output.appendLine(`Buff indexing failed: ${String(error)}`);
  }
}

async function indexWorkspaceEffects(): Promise<void> {
  try {
    const files = await vscode.workspace.findFiles(effectFilePattern, excludedPattern, 2000);
    const contentsByUri = new Map<string, vscode.TextDocument>();
    for (const document of vscode.workspace.textDocuments) {
      if (isEffectFile(document.uri)) contentsByUri.set(document.uri.toString(), document);
    }

    const nextDefinitions = new Map<string, EffectDefinition>();
    let linesScanned = 0;
    for (const file of files) {
      const document = contentsByUri.get(file.toString()) ?? await vscode.workspace.openTextDocument(file);
      for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
        const line = document.lineAt(lineNumber).text;
        const match = /^\s*effect:\s*.*?\.name\s+"([^"]+)"/.exec(line);
        if (!match) continue;
        linesScanned++;
        const id = match[1];
        if (!nextDefinitions.has(id)) {
          nextDefinitions.set(id, {
            uri: document.uri,
            // Effect declarations are one Darkest line each; selecting the full line
            // makes Ctrl+click reveal the whole effect instead of only its ID.
            range: new vscode.Range(lineNumber, 0, lineNumber, line.length),
            idRange: new vscode.Range(lineNumber, match.index + match[0].indexOf(id), lineNumber, match.index + match[0].indexOf(id) + id.length),
            attributes: parseEffectAttributes(line),
          });
        }
      }
    }

    effectDefinitions.clear();
    for (const [id, definition] of nextDefinitions) effectDefinitions.set(id, definition);
    output.appendLine(`Indexed ${effectDefinitions.size} effect ID(s) from ${files.length} file(s); scanned ${linesScanned} definitions.`);
    updateVisibleEditors();
    void indexWorkspaceUses();
  } catch (error) {
    output.appendLine(`Effect indexing failed: ${String(error)}`);
  }
}

async function indexWorkspaceUses(): Promise<void> {
  try {
    const [darkestFiles, trinketFiles] = await Promise.all([
      vscode.workspace.findFiles("**/*.darkest", excludedPattern, 5000),
      vscode.workspace.findFiles("**/*.entries.trinkets.json", excludedPattern, 2000),
    ]);
    const files = new Map<string, vscode.Uri>();
    for (const uri of [...darkestFiles, ...trinketFiles]) files.set(uri.toString(), uri);
    for (const document of vscode.workspace.textDocuments) {
      if (document.languageId === "darkest" || isTrinketFile(document.uri)) files.set(document.uri.toString(), document.uri);
    }

    const nextUses = new Map<string, ReferenceUse[]>();
    for (const uri of files.values()) {
      const document = vscode.workspace.textDocuments.find(item => item.uri.toString() === uri.toString())
        ?? await vscode.workspace.openTextDocument(uri);
      for (const reference of parseDocumentReferences(document)) {
        const key = referenceKey(reference.kind, reference.id);
        const locations = nextUses.get(key) ?? [];
        locations.push({ uri: document.uri, range: reference.range });
        nextUses.set(key, locations);
      }
    }
    referenceUses.clear();
    for (const [key, locations] of nextUses) referenceUses.set(key, locations);
    output.appendLine(`Indexed ${[...referenceUses.values()].reduce((total, locations) => total + locations.length, 0)} effect/buff use(s) from ${files.size} file(s).`);
  } catch (error) {
    output.appendLine(`Reference-use indexing failed: ${String(error)}`);
  }
}

function formatUsageHover(kind: "effect" | "buff", id: string): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString();
  markdown.appendMarkdown(`### ${kind === "effect" ? "Effect" : "Buff"} \`${escapeInlineCode(id)}\`\n\n`);
  const uses = referenceUses.get(referenceKey(kind, id)) ?? [];
  if (!uses.length) {
    markdown.appendMarkdown("**Used in:** No references found in this workspace.");
    return markdown;
  }
  markdown.appendMarkdown(`**Used in (${uses.length}):**\n\n`);
  for (const use of uses.slice(0, 50)) {
    const line = use.range.start.line + 1;
    const label = `${vscode.workspace.asRelativePath(use.uri)}:${line}`;
    const command = `command:darkest.openReferenceUse?${encodeURIComponent(JSON.stringify([use.uri.toString(), line, use.range.start.character, use.range.end.character]))}`;
    markdown.appendMarkdown(`- [${escapeInlineCode(label)}](${command})\n`);
  }
  if (uses.length > 50) markdown.appendMarkdown(`\n…and ${uses.length - 50} more.`);
  markdown.isTrusted = { enabledCommands: ["darkest.openReferenceUse"] };
  return markdown;
}

function findDefinitionHover(document: vscode.TextDocument, position: vscode.Position): vscode.MarkdownString | undefined {
  for (const [id, definition] of effectDefinitions) {
    if (definition.uri.toString() === document.uri.toString() && definition.idRange.contains(position)) {
      return formatUsageHover("effect", id);
    }
  }
  for (const [id, definition] of buffDefinitions) {
    if (definition.uri.toString() === document.uri.toString() && definition.idRange.contains(position)) {
      return formatUsageHover("buff", id);
    }
  }
  return undefined;
}

function decorateEditor(editor: vscode.TextEditor): void {
  if (editor.document.languageId !== "darkest" && !isTrinketFile(editor.document.uri)) {
    editor.setDecorations(validDecoration, []);
    editor.setDecorations(invalidDecoration, []);
    return;
  }

  const valid: vscode.DecorationOptions[] = [];
  const invalid: vscode.DecorationOptions[] = [];
  for (const reference of parseDocumentReferences(editor.document)) {
      const known = reference.kind === "buff"
        ? buffDefinitions.has(reference.id)
        : effectDefinitions.has(reference.id);
      const decoration: vscode.DecorationOptions = {
        range: reference.range,
        hoverMessage: known
          ? `${reference.kind === "buff" ? "Buff" : "Effect"} found: ${reference.id}`
          : `Unresolved ${reference.kind} ID: ${reference.id}`,
      };
      (known ? valid : invalid).push(decoration);
  }
  editor.setDecorations(validDecoration, valid);
  editor.setDecorations(invalidDecoration, invalid);
  const validEffects = parseDocumentReferenceCount(editor.document, "effect", true);
  const validBuffs = parseDocumentReferenceCount(editor.document, "buff", true);
  const invalidEffects = parseDocumentReferenceCount(editor.document, "effect", false);
  const invalidBuffs = parseDocumentReferenceCount(editor.document, "buff", false);
  output.appendLine(`${editor.document.uri.fsPath}: ${validEffects} valid effect(s), ${invalidEffects} unresolved effect(s), ${validBuffs} valid buff(s), ${invalidBuffs} unresolved buff(s).`);
}

function parseDocumentReferenceCount(document: vscode.TextDocument, kind: "effect" | "buff", known: boolean): number {
  let count = 0;
  for (const reference of parseDocumentReferences(document)) {
      if (reference.kind !== kind) continue;
      const exists = kind === "buff" ? buffDefinitions.has(reference.id) : effectDefinitions.has(reference.id);
      if (exists === known) count++;
  }
  return count;
}

function updateVisibleEditors(): void {
  for (const editor of vscode.window.visibleTextEditors) decorateEditor(editor);
}

async function showDocumentAt(uri: vscode.Uri, selection: vscode.Range): Promise<vscode.TextEditor> {
  const visibleEditor = vscode.window.visibleTextEditors.find(
    editor => editor.document.uri.toString() === uri.toString(),
  );
  const existingTab = vscode.window.tabGroups.all
    .map(group => ({ group, tab: group.tabs.find(item =>
      item.input instanceof vscode.TabInputText && item.input.uri.toString() === uri.toString()) }))
    .find(item => item.tab);
  const viewColumn = visibleEditor?.viewColumn ?? existingTab?.group.viewColumn ?? vscode.window.activeTextEditor?.viewColumn;
  return vscode.window.showTextDocument(uri, {
    ...(viewColumn !== undefined ? { viewColumn } : {}),
    selection,
    preview: false,
    preserveFocus: false,
  });
}

export function registerEffectReferenceFeatures(context: vscode.ExtensionContext): void {
  context.subscriptions.push(output, validDecoration, invalidDecoration);
  output.appendLine(`Extension activated: ${context.extensionPath}`);

  context.subscriptions.push(vscode.commands.registerCommand("darkest.openBuffDefinition", (id: string) => {
    const definition = buffDefinitions.get(id);
    if (!definition) {
      output.appendLine(`Buff link lookup: unresolved buff ID "${id}".`);
      return undefined;
    }
    output.appendLine(`Buff link lookup: ${id} -> ${definition.uri.fsPath}:${definition.range.start.line + 1}.`);
    return showDocumentAt(definition.uri, definition.range);
  }));

  const referenceDocumentSelector: vscode.DocumentSelector = [
    { language: "darkest" },
    { language: "json", pattern: "**/*.entries.trinkets.json" },
  ];
  const hoverDocumentSelector: vscode.DocumentSelector = [
    ...referenceDocumentSelector,
    { language: "json", pattern: "**/*.buffs.json" },
  ];
  context.subscriptions.push(vscode.commands.registerCommand(
    "darkest.openReferenceUse",
    async (uriString: string, line: number, start: number, end: number) => {
      const uri = vscode.Uri.parse(uriString);
      const selection = new vscode.Range(line - 1, start, line - 1, end);
      return showDocumentAt(uri, selection);
    },
  ));
  context.subscriptions.push(vscode.languages.registerDefinitionProvider(referenceDocumentSelector, {
    provideDefinition(document, position) {
      const line = document.lineAt(position.line).text;
      const reference = parseDocumentReferences(document).find(item => item.range.contains(position));
      const definition = reference
        ? reference.kind === "buff" ? buffDefinitions.get(reference.id) : effectDefinitions.get(reference.id)
        : undefined;
      if (!reference) {
        output.appendLine(`Definition lookup: cursor is not on an effect reference at ${document.uri.fsPath}:${position.line + 1}.`);
        return undefined;
      }
      if (!definition) {
        output.appendLine(`Definition lookup: unresolved effect ID "${reference.id}".`);
        return undefined;
      }
      output.appendLine(`Definition lookup: ${reference.kind} ${reference.id} -> ${definition.uri.fsPath}:${definition.range.start.line + 1}.`);
      return new vscode.Location(definition.uri, definition.range);
    },
  }));

  context.subscriptions.push(vscode.languages.registerHoverProvider(hoverDocumentSelector, {
    provideHover(document, position) {
      const reference = parseDocumentReferences(document).find(item => item.range.contains(position));
      if (!reference) {
        const definitionHover = findDefinitionHover(document, position);
        return definitionHover ? new vscode.Hover(definitionHover) : undefined;
      }
      const definition = reference.kind === "buff"
        ? buffDefinitions.get(reference.id)
        : effectDefinitions.get(reference.id);
      if (!definition) {
        const markdown = new vscode.MarkdownString(`### Unresolved ${reference.kind} \`${escapeInlineCode(reference.id)}\`\n\nNo matching ${reference.kind} definition was found in this workspace.`);
        return new vscode.Hover(markdown, reference.range);
      }
      const markdown = reference.kind === "buff"
        ? formatBuffHover(reference.id, (definition as BuffDefinition).fields)
        : formatEffectHover(reference.id, (definition as EffectDefinition).attributes);
      return new vscode.Hover(markdown, reference.range);
    },
  }));

  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(document => {
    if (isEffectFile(document.uri)) void indexWorkspaceEffects();
    if (isBuffFile(document.uri)) void indexWorkspaceBuffs();
    updateVisibleEditors();
  }));
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
    void indexWorkspaceEffects();
    void indexWorkspaceBuffs();
    updateVisibleEditors();
  }));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
    if (isEffectFile(event.document.uri)) void indexWorkspaceEffects();
    else if (isBuffFile(event.document.uri)) void indexWorkspaceBuffs();
    else if (event.document.languageId === "darkest" || isTrinketFile(event.document.uri)) void indexWorkspaceUses();
    if (event.document.languageId === "darkest" || isTrinketFile(event.document.uri)) {
      const editor = vscode.window.visibleTextEditors.find(item => item.document.uri.toString() === event.document.uri.toString());
      if (editor) decorateEditor(editor);
    }
  }));
  context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(updateVisibleEditors));
  void indexWorkspaceEffects();
  void indexWorkspaceBuffs();
  void indexWorkspaceUses();
}
