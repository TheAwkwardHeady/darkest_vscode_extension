import * as vscode from "vscode";
import { GAME_MECHANICS_SCHEMA, Sources } from "./game-mechanics-schema";
import { throttle } from "./utils/throttle";
import { isStringObject } from "util/types";
import { validator } from "./valueValidation";
import { gatherModes } from "./modeValidation";
import { checkIfEffectFile, addEffect, addEffectParameter } from "./effectCreation";
import { DarkestCompletionItemProvider } from "./completion-item-provider";
import { registerEffectReferenceFeatures } from "./effectReferenceFeatures";
import { checkIfLocFile, updateZWSP, createZWSP, createTooltipString } from "./locTools";
import { checkIfBuffFile, createTooltipBuff, createBuff } from "./buffTools";
import { BuffSchemaCompletionProvider, allStatTypes, statSubtypesByType, ruleTypes, durationTypes } from "./buffSchemaCompletion";

let modes: string[] = [];

const effectTriggerOrder = ".apply_with_result true -> .apply_with_result true on a Trinket -> Regular Effect -> Regular Effect on a Trinket -> .queue true -> .queue true on a Trinket";

export function activate(context: vscode.ExtensionContext) {
  registerEffectReferenceFeatures(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("darkest.chooseBuffValue", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || !/\.buffs\.json$/i.test(editor.document.fileName)) {
        vscode.window.showWarningMessage("Choose Buff Value is only available in .buffs.json files.");
        return;
      }

      const document = editor.document;
      const position = editor.selection.active;
      const line = document.lineAt(position.line).text;
      const keyMatch = /"(stat_type|stat_sub_type|rule_type|duration_type)"\s*:\s*"([^"]*)"/.exec(line);
      if (!keyMatch) {
        vscode.window.showInformationMessage("Place the cursor inside a stat_type, stat_sub_type, rule_type, or duration_type string.");
        return;
      }

      const key = keyMatch[1];
      const valueStart = line.indexOf('"', keyMatch.index + keyMatch[0].indexOf(':')) + 1;
      const valueEnd = line.indexOf('"', valueStart);
      let choices: { value: string; detail?: string }[] = [];
      if (key === "stat_type") {
        choices = allStatTypes.map(value => ({ value }));
      } else if (key === "stat_sub_type") {
        const textBefore = document.getText(new vscode.Range(new vscode.Position(0, 0), position));
        const objectStart = textBefore.lastIndexOf("{");
        const objectText = textBefore.slice(objectStart >= 0 ? objectStart : 0);
        const typeMatch = /"stat_type"\s*:\s*"([^"]+)"/.exec(objectText);
        const statType = typeMatch?.[1];
        choices = statType ? (statSubtypesByType[statType] ?? []).map(item => ({ value: item.value, detail: item.detail })) : [];
        // Stat types without a defined subtype list use an empty string.
        choices.push({ value: "", detail: "Empty subtype" });
      } else if (key === "rule_type") {
        choices = ruleTypes;
      } else if (key === "duration_type") {
        choices = durationTypes;
      }

      if (choices.length === 0) {
        vscode.window.showInformationMessage(`No known values are configured for ${key} in this context.`);
        return;
      }

      const selected = await vscode.window.showQuickPick(
        choices.map(item => ({ label: item.value || '(empty string)', description: item.detail })),
        { placeHolder: `Search ${key} values`, matchOnDescription: true }
      );
      if (!selected) return;
      const replacement = selected.label === '(empty string)' ? "" : selected.label;
      await editor.edit(edit => edit.replace(
        new vscode.Range(new vscode.Position(position.line, valueStart), new vscode.Position(position.line, valueEnd)),
        replacement
      ));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("darkest.createBuffEntry", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const document = editor.document;
      if (!/\.buffs\.json$/i.test(document.fileName)) {
        vscode.window.showWarningMessage("Create Buff Entry is only available in .buffs.json files.");
        return;
      }

      const text = document.getText();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        vscode.window.showErrorMessage("The buff JSON must be valid before a new buff can be added.");
        return;
      }
      if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { buffs?: unknown }).buffs)) {
        vscode.window.showErrorMessage('This file must contain a "buffs" array.');
        return;
      }

      const keyMatch = /"buffs"\s*:\s*\[/g.exec(text);
      if (!keyMatch) {
        vscode.window.showErrorMessage('Could not locate the "buffs" array.');
        return;
      }
      const openBracket = text.indexOf("[", keyMatch.index);
      let depth = 0;
      let inString = false;
      let escaped = false;
      let closeBracket = -1;
      for (let i = openBracket; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
          if (escaped) escaped = false;
          else if (ch === "\\") escaped = true;
          else if (ch === '"') inString = false;
          continue;
        }
        if (ch === '"') inString = true;
        else if (ch === "[") depth++;
        else if (ch === "]" && --depth === 0) { closeBracket = i; break; }
      }
      if (closeBracket < 0) {
        vscode.window.showErrorMessage('Could not locate the end of the "buffs" array.');
        return;
      }

      const template = `      {\n         "id" : "YOUR_BUFF_ID",\n         "stat_type" : "upgrade_discount",\n         "stat_sub_type" : "",\n         "amount" : 0,\n         "remove_if_not_active" : false,\n         "rule_type" : "always",\n         "is_false_rule" : false,\n         "rule_data" : {\n            "float" : 0,\n            "string" : ""\n         }\n      }`;
      const beforeClose = text.slice(openBracket + 1, closeBracket);
      const lastContentIndex = beforeClose.search(/\S(?=\s*$)/);
      let insertionOffset: number;
      let insertionText: string;
      if (lastContentIndex < 0) {
        // Insert just inside the opening bracket so both inline [] and multiline arrays work.
        insertionOffset = openBracket + 1;
        insertionText = `\n${template}\n`;
      } else {
        insertionOffset = openBracket + 1 + lastContentIndex + 1;
        insertionText = `,\n${template}`;
      }
      await editor.edit(editBuilder => editBuilder.insert(document.positionAt(insertionOffset), insertionText));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("darkest.createTrinketEntry", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const document = editor.document;
      if (!/\.entries\.trinkets\.json$/i.test(document.fileName)) {
        vscode.window.showWarningMessage("Create Trinket Entry is only available in .entries.trinkets.json files.");
        return;
      }

      const text = document.getText();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        vscode.window.showErrorMessage("The trinket JSON must be valid before a new entry can be added.");
        return;
      }

      if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { entries?: unknown }).entries)) {
        vscode.window.showErrorMessage('This file must contain an "entries" array.');
        return;
      }

      const entries = (parsed as { entries: unknown[] }).entries;
      const keyMatch = /"entries"\s*:\s*\[/g.exec(text);
      if (!keyMatch) {
        vscode.window.showErrorMessage('Could not locate the "entries" array.');
        return;
      }
      const openBracket = text.indexOf("[", keyMatch.index);
      let depth = 0;
      let inString = false;
      let escaped = false;
      let closeBracket = -1;
      for (let i = openBracket; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
          if (escaped) escaped = false;
          else if (ch === "\\") escaped = true;
          else if (ch === '"') inString = false;
          continue;
        }
        if (ch === '"') inString = true;
        else if (ch === "[") depth++;
        else if (ch === "]" && --depth === 0) {
          closeBracket = i;
          break;
        }
      }
      if (closeBracket < 0) {
        vscode.window.showErrorMessage('Could not locate the end of the "entries" array.');
        return;
      }

      const template = `      {\n         "id" : "YOUR_TRINKET_ID",\n         "buffs" :\n         [\n\n         ],\n         "hero_class_requirements":\n         [\n\n         ],\n         "rarity" : "uncommon",\n         "price" : 10000,\n         "limit" : 1,\n         "origin_dungeon" : ""\n      }`;
      const beforeClose = text.slice(openBracket + 1, closeBracket);
      const lastContentIndex = beforeClose.search(/\S(?=\s*$)/);
      let insertionOffset: number;
      let insertionText: string;
      if (lastContentIndex < 0) {
        const closeLineStart = text.lastIndexOf("\n", closeBracket) + 1;
        insertionOffset = closeLineStart;
        insertionText = `${template}\n`;
      } else {
        const lastCharOffset = openBracket + 1 + lastContentIndex;
        insertionOffset = lastCharOffset + 1;
        insertionText = `,\n${template}`;
      }

      await editor.edit(editBuilder => {
        editBuilder.insert(document.positionAt(insertionOffset), insertionText);
      });
    })
  );

  const entryValidationCollection = vscode.languages.createDiagnosticCollection("darkest-entry-validation");
  context.subscriptions.push(entryValidationCollection);
  const validateJsonEntries = (document: vscode.TextDocument) => {
    const fileName = document.fileName.toLowerCase();
    const isBuffs = fileName.endsWith(".buffs.json");
    const isTrinkets = fileName.endsWith(".entries.trinkets.json");
    if (!isBuffs && !isTrinkets) return;
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];
    try {
      JSON.parse(text);
      const arrayName = isBuffs ? "buffs" : "entries";
      const arrayMatch = new RegExp('"' + arrayName + '"\\s*:\\s*\\[').exec(text);
      if (arrayMatch) {
        const arrayStart = arrayMatch.index + arrayMatch[0].length;
        let inString = false, escaped = false, depth = 0, objectStart = -1;
        const required = isBuffs
          ? ["id", "stat_type", "stat_sub_type", "amount", "rule_type", "rule_data"]
          : ["id", "buffs", "hero_class_requirements", "rarity", "limit"];
        for (let i = arrayStart; i < text.length; i++) {
          const ch = text[i];
          if (inString) { if (escaped) escaped = false; else if (ch === "\\") escaped = true; else if (ch === '"') inString = false; continue; }
          if (ch === '"') { inString = true; continue; }
          if (ch === "[") { if (depth === 0) break; depth++; }
          else if (ch === "]") { if (depth === 0) break; depth--; }
          else if (ch === "{") { if (depth === 0) objectStart = i; depth++; }
          else if (ch === "}") {
            depth--;
            if (depth === 0 && objectStart >= 0) {
              const entryText = text.slice(objectStart, i + 1);
              const missing = required.filter(key => !new RegExp('"' + key + '"\\s*:').test(entryText));
              const entryRange = new vscode.Range(document.positionAt(objectStart), document.positionAt(i + 1));
              if (missing.length) {
                const diagnostic = new vscode.Diagnostic(entryRange, `Invalid ${isBuffs ? "buff" : "trinket"} entry. Missing required fields: ${missing.map(k => '`' + k + '`').join(", ")}.`, vscode.DiagnosticSeverity.Error);
                diagnostic.code = "missing-required-entry-fields";
                diagnostics.push(diagnostic);
              }
              if (isBuffs) {
                try {
                  const entry = JSON.parse(entryText) as { rule_type?: unknown };
                  const allowedRuleTypes = ruleTypes.map(item => item.value);
                  if (typeof entry.rule_type !== "string" || !allowedRuleTypes.includes(entry.rule_type)) {
                    const ruleMatch = /"rule_type"\s*:\s*("(?:\\.|[^"\\])*"|[^,}\s]*)/.exec(entryText);
                    const ruleStart = ruleMatch ? objectStart + ruleMatch.index : objectStart;
                    const ruleEnd = ruleMatch ? ruleStart + ruleMatch[0].length : i + 1;
                    const ruleRange = new vscode.Range(document.positionAt(ruleStart), document.positionAt(ruleEnd));
                    const message = `Invalid rule_type '${String(entry.rule_type ?? "missing")}'. This value can crash the game. Use a supported rule_type.`;
                    const propertyDiagnostic = new vscode.Diagnostic(ruleRange, message, vscode.DiagnosticSeverity.Error);
                    propertyDiagnostic.code = "invalid-buff-rule-type";
                    diagnostics.push(propertyDiagnostic);
                    const entryDiagnostic = new vscode.Diagnostic(entryRange, `Invalid buff entry: rule_type '${String(entry.rule_type ?? "missing")}' is not supported and may crash the game.`, vscode.DiagnosticSeverity.Error);
                    entryDiagnostic.code = "invalid-buff-rule-type-entry";
                    diagnostics.push(entryDiagnostic);
                  }
                } catch { /* JSON syntax errors are reported by the JSON language service. */ }
              }
              objectStart = -1;
            }
          }
        }
      }
    } catch { /* Let the JSON language service report syntax errors. */ }
    entryValidationCollection.set(document.uri, diagnostics);
  };
  for (const document of vscode.workspace.textDocuments) validateJsonEntries(document);
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(validateJsonEntries));
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => validateJsonEntries(event.document)));

  const collection = vscode.languages.createDiagnosticCollection("darkest");
  if (vscode.window.activeTextEditor) {
    throttledUpdateDiagnostics(
      vscode.window.activeTextEditor.document,
      collection
    );
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        throttledUpdateDiagnostics(editor.document, collection);
      }
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document) {
        throttledUpdateDiagnostics(event.document, collection);
      }
    })
  );
  context.subscriptions.push(vscode.languages.registerCodeActionsProvider("darkest", {
    provideCodeActions(document, range, codeActionContext) {
      if (codeActionContext.diagnostics.length === 0) return undefined;
      const lineNumber = range.start.line;
      if (lineNumber > 0 && document.lineAt(lineNumber - 1).text.trim() === "// @darkest-ignore") return undefined;

      const action = new vscode.CodeAction(
        "Ignore Darkest warnings on this line",
        vscode.CodeActionKind.QuickFix,
      );
      const edit = new vscode.WorkspaceEdit();
      const newline = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
      edit.insert(document.uri, new vscode.Position(lineNumber, 0), `// @darkest-ignore${newline}`);
      action.edit = edit;
      action.diagnostics = [...codeActionContext.diagnostics];
      return [action];
    },
  }));
  context.subscriptions.push(
    vscode.commands.registerCommand("darkest.getGameMechanicsSchema", () => {
      const schema = JSON.parse(JSON.stringify(GAME_MECHANICS_SCHEMA));
      Object.keys(schema).forEach((key) => {
        if (schema[key][".valid_modes"]) {
          schema[key][".valid_modes"].allowed_values = modes;
        }
      });
      for (let mode of modes) {
        let paramKey = "." + mode + "_effects";
        schema.combat_skill[paramKey] = {
          type: "string_list",
          description: "Effects IDs for the " + mode + " mode",
        };
        schema.skill[paramKey] = {
          type: "string_list",
          description: "Effects IDs for the " + mode + " mode",
        };
        schema.combat_move_skill[paramKey] = {
          type: "string_list",
          description: "Effects IDs for the " + mode + " mode",
        };
        schema.riposte_skill[paramKey] = {
          type: "string_list",
          description: "Effects IDs for the " + mode + " mode",
        };
      }
      return schema;
    })
  );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      "darkest",
      new DarkestCompletionItemProvider(),
      ".",
      '"'
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: "json", scheme: "file" },
      new BuffSchemaCompletionProvider(),
      '"'
    )
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('darkest', {
      async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
        const line = document.lineAt(position.line).text;
        const keyword = line.match(/\w+(?=:)/)?.[0]!;
        const paramRange = document.getWordRangeAtPosition(position);
        const paramBase = document.getText(paramRange);
        let param = "."+paramBase;

        const gameMechanicsSchema: typeof GAME_MECHANICS_SCHEMA = await vscode.commands.executeCommand("darkest.getGameMechanicsSchema");

        if (gameMechanicsSchema[keyword]) {
          if (gameMechanicsSchema[keyword][param]) {
            const commonName = gameMechanicsSchema[keyword][param].commonName;
            const desc = gameMechanicsSchema[keyword][param].description;
            const vanillaValuesTitle = gameMechanicsSchema[keyword][param].vanillaValuesTitle;
            const vanillaValuesArray = gameMechanicsSchema[keyword][param].vanillaValues;
            const addInfo = gameMechanicsSchema[keyword][param].addInfo;
            const displayEffectOrder = gameMechanicsSchema[keyword][param].displayEffectOrder;
            const referenceDesc = gameMechanicsSchema[keyword][param].referenceDesc;
            const sourceList = gameMechanicsSchema[keyword][param].sourceList;

            let hint:string;
            commonName ? hint = `### ${commonName}` : hint = `### ${param}`;
            desc ? hint += `\n#### Description:\n${desc}`:null;
            referenceDesc ? hint += `\n#### Description:\n${gameMechanicsSchema[keyword][referenceDesc].description}`:null;
            addInfo ? hint += `\n#### Additional Info:\n${addInfo}`:null;
            displayEffectOrder ? hint += `\n#### Timing/Trigger order of Effects:\n${effectTriggerOrder}`:null;
            
            if(vanillaValuesArray){
              let vanillaValues = ``;
              for(let value of vanillaValuesArray){
                if(value === vanillaValuesArray[0]){vanillaValues += `${value}`;}
                else {vanillaValues += `, ${value}`;}
              }
              hint += `\n#### ${vanillaValuesTitle}:\n${vanillaValues}`;
            }
            
            if(sourceList){
              const sourceListData = Sources[sourceList];
              let sources = ``;
              for(let value of sourceListData.list){
                if(value === sourceListData.list[0]){sources += `${value}`;}
                else {sources += `, ${value}`;}
                if (sourceListData.comments){sources += ` (${sourceListData.comments[value]})`;}
              }
              hint += `\n#### ${sourceListData.title}:\n${sources}`;
            }

            return new vscode.Hover([new vscode.MarkdownString(hint)]);
          }
        }
      }
    })
  );

  //#region Effect Stuff
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addStun", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "stun");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addUnstun", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "unstun");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addMark", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "tag");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addUnmark", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "untag");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addBleed", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "bleed");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addBlight", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "blight");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addCureBleed", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "cureBleed");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addCureBlight", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "cureBlight");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addCureDOTS", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "cureDOTS");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addHeal", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "heal");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addRegen", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "regen");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addStress", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "stress");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addDestress", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "destress");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addHorror", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "horror");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addCureHorror", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "cureHorror");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addGuard", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "guard");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addClearGuard", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "clearGuard");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addBuff1", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "buff1");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addBuff2", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "buff2");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addCureDebuff", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "cureDebuff");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addADOT", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "adot");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addSetMode", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "setMode");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addRiposte", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "riposte");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addClearRiposte", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "clearRiposte");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addPush", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "push");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addPull", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "pull");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addShuffleTarget", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "shuffleTarget");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addShuffleParty", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "shuffleParty");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addShuffleDOT", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffect(editor, "shuffleDOT");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addInstant", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffectParameter(editor, "instant");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addHasDesc", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffectParameter(editor, "hasDesc");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addQueue", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffectParameter(editor, "queue");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addApplyOnce", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffectParameter(editor, "applyOnce");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addApplyOnDeath", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffectParameter(editor, "applyOnDeath");
        }
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand("darkest.addAWR", () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          addEffectParameter(editor, "AWR");
        }
      })
    );
  //#endregion

  //#region Loc Stuff
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateZWSP));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(updateZWSP));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(updateZWSP));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => { setTimeout(updateZWSP, 100); }));
    updateZWSP();

    context.subscriptions.push(
      vscode.commands.registerCommand('darkest.adjustZWSP', async (currenNum) => {
        const adustedString = await vscode.window.showInputBox({
          prompt: `Enter the number of ZWSPs you want to have. Current Number: ${currenNum.length}`,
          value: currenNum.length.toString(),
          validateInput: val => isNaN(Number(val)) || Number(val) < 0 ? "Must be a positive number." : null
        });

        const adjustedNum = Number(adustedString);
        if (isNaN(adjustedNum)) {return;}

        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}

        const startPos = new vscode.Position(currenNum.line, currenNum.index);
        const endPos = new vscode.Position(currenNum.line, currenNum.index + currenNum.length);

        await editor.edit(editBuilder => {
          editBuilder.replace(new vscode.Range(startPos, endPos), '\u200B'.repeat(adjustedNum));
        });
      })
    );

    context.subscriptions.push(
      vscode.languages.registerHoverProvider('xml', {
        provideHover(document, position, token) {
          const lineText = document.lineAt(position.line).text;
          const regex = /(\u200B+)/g;
          let match;
          while ((match = regex.exec(lineText)) !== null) {
            const start = match.index;
            const end = match.index + match[0].length;
            if (position.character >= start && position.character < end) {
              const args = encodeURIComponent(JSON.stringify({
                line: position.line,
                index: start,
                length: match[0].length
              }));
              const cmdUri = `command:darkest.adjustZWSP?${args}`;
              const md = new vscode.MarkdownString(`[${match[0].length} Zero-Width Spaces – Click to edit](${cmdUri})`);
              md.isTrusted = true;
              return new vscode.Hover(md);
            }
          }
          return null;
        }
      })
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand('darkest.createZWSP', async () => {
        const ZWSPInput = await vscode.window.showInputBox({
          prompt: `Enter the number of ZWSPs you want to have.`,
          validateInput: val => isNaN(Number(val)) || Number(val) < 0 ? "Must be a positive number." : null
        });

        const ZWSPNum = Number(ZWSPInput);
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          createZWSP(editor, ZWSPNum);
        }
      })
    );
    
    context.subscriptions.push(
      vscode.commands.registerCommand('darkest.createTooltipString', async () => {
        const tooltipInput = await vscode.window.showInputBox({
          prompt: `Enter the Tooltip buffID.`,
          validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
        });

        const tooltipID = String(tooltipInput);
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          createTooltipString(editor, tooltipID);
        }
      })
    );
  //#endregion

  //#region Buff Stuff
    //#region Tooltip Buff
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createTooltipBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the Tooltip buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createTooltipBuff(editor, tooltipID);
          }
        })
      );
    //#endregion
    
    //#region Heal / Regen Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatHealBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_heal_amount", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createPercentHealBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_heal_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createHealRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_heal_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRegenDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_heal_dot_duration_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRegenDurRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_heal_dot_duration_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRegenAmountBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_heal_dot_amount_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRegenAmountRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_heal_dot_amount_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRegenAsBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_heal", "");
          }
        })
      );
    //#endregion
    
    //#region Combat Stat Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatMaxHPBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "max_hp");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatMinDMGBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "damage_low");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatMaxDMGBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "damage_high");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatACCBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "attack_rating");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatCRITBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "crit_chance");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatDodgeBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "defense_rating");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatPROTBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "protection_rating");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createFlatSPDBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "speed_rating");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRiposteOnHitBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "riposte_on_hit_chance");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRiposteOnMissBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_add", "riposte_on_miss_chance");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createMaxHPMultBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_multiply", "max_hp");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createMinDMGMultBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_multiply", "damage_low");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createMaxDMGMultBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_multiply", "damage_high");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createACCMultBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_multiply", "attack_rating");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createCRITMultBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_multiply", "crit_chance");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDodgeMultBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_multiply", "defense_rating");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createPROTMultBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_multiply", "protection_rating");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createSPDMultBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "combat_stat_multiply", "speed_rating");
          }
        })
      );
    //#endregion

    //#region Resistance Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStunResBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resistance", "stun");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createMoveResBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resistance", "move");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBlightResBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resistance", "poison");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedResBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resistance", "bleed");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDiseaseResBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resistance", "disease");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDebuffResBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resistance", "debuff");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDeathBlowResBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resistance", "death_blow");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createTrapResBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resistance", "trap");
          }
        })
      );
    //#endregion
  
    //#region Skill Chance Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStunChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stun_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createMoveChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "move_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createPoisonChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "poison_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "bleed_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDebuffChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "debuff_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDeathBlowChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "deathblow_chance", "");
          }
        })
      );
    //#endregion
  
    //#region Stress / Horror Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStressBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_dmg_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStressRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_dmg_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStressOnMissBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_on_miss", "Insert Stress Amount");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createHorrorDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_dot_duration_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createHorrorDurRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_dot_duration_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createHorrorAmountBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_dot_amount_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createHorrorAmountRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_dot_amount_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createHorrorAsBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_dot", "");
          }
        })
      );
    //#endregion
  
    //#region Disable Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableHealBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "heal");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableBuffBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "buff");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableDebuffBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "debuff");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableBleedBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "bleed");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableBlightBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "poison");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableStunBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "stun");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableTagBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "tag");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableStressBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "stress");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableMoveBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "move");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableGuardBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "guard");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDisableDazeBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "disable_combat_skill_attribute", "daze");
          }
        })
      );
    //#endregion
  
    //#region DOT Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_bleed_duration_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedDurRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_bleed_duration_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedAmountBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_bleed_amount_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedAmountRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_bleed_amount_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedAsBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_bleed", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedCureChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "cure_bleed_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBleedCureRecChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "cure_bleed_received_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBlightDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_poison_duration_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBlightDurRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_poison_duration_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBlightAmountBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_poison_amount_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBlightAmountRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_poison_amount_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBlightAsBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "hp_dot_poison", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBlightCureChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "cure_poison_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBlightCureRecChanceBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "cure_poison_received_chance", "");
          }
        })
      );
    //#endregion
  
    //#region Stumble Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStumbleDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "shuffle_dot_duration_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStumbleDurRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "shuffle_dot_duration_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStumbleAsBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "shuffle_dot", "");
          }
        })
      );
    //#endregion
  
    //#region Shard Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createShardsGainedBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "shard_reward_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createShardsUsedBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "shard_consume_percent", "");
          }
        })
      );
    //#endregion

    //#region Stress Heal Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStressHealBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_heal_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStressHealRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_heal_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStressHealOnHeartAttackBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "heartattack_stress_heal_percent", "");
          }
        })
      );
    //#endregion
  
    //#region Guard Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createGuardDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "guard_duration_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createGuardDurRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "guard_duration_received_percent", "");
          }
        })
      );
    //#endregion
  
    //#region Block Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createPreventGuardBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "guard_blocked", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createPreventTagBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "tag_blocked", "");
          }
        })
      );
    //#endregion
  
    //#region Ignore Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createIgnoreGuardBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "ignore_guard", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createIgnoreProtBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "ignore_protection", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createIgnoreStealthBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "ignore_stealth", "");
          }
        })
      );
    //#endregion
  
    //#region Hamlet Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createActivitySideEffectBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "activity_side_effect_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStressPerWeekBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "stress_from_idle_in_town", "");
          }
        })
      );
    //#endregion
  
    //#region Dungeon Exploration Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createHeroSurpriseBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "party_surprise_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createMonsterSurpriseBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "monsters_surprise_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createCampAmbushBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "ambush_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createScountingBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "scouting_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createStarvingBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "starving_damage_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createEatingBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "food_consumption_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createCurioQuirkRemoveBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "remove_negative_quirk_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createXPBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resolve_xp_bonus_percent", "");
          }
        })
      );
    //#endregion
  
    //#region Misc Combat Buffs
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDMGRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "damage_received_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createCRITRecBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "crit_received_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createVirtueBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "resolve_check_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createThirstEvoDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "vampire_evolution_duration", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createQuirkEvoDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "quirk_tag_evolution_duration", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createQuirkDeathImmuneBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "quirk_evolution_death_immune", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRiposteBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "riposte", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createTorchGainBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "torch_increase_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createTorchLossBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "torch_decrease_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createTorchBurnBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "torchlight_burn_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createTorchBurnBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "torchlight_burn_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createDMGReflectBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "damage_reflect_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRandomTargetFriendlyBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "random_target_friendly_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRandomTargetAttackBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "random_target_attack_chance", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createRiposteDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "riposte_duration_percent", "");
          }
        })
      );
      context.subscriptions.push(
        vscode.commands.registerCommand('darkest.createBuffDurBuff', async () => {
          const tooltipInput = await vscode.window.showInputBox({
            prompt: `Enter the buffID.`,
            validateInput: val => isStringObject(String(val)) ? "Must be a string." : null
          });
          const tooltipID = String(tooltipInput);
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            createBuff(editor, tooltipID, "buff_duration_percent", "");
          }
        })
      );
    //#endregion
  //#endregion
}

export function deactivate() {}

async function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
) {
  collection.clear();

  if (document.languageId === "darkest") {
    const diagnostics: vscode.Diagnostic[] = [];

    modes = gatherModes(document);
    const gameMechanicsSchema: typeof GAME_MECHANICS_SCHEMA =
      await vscode.commands.executeCommand("darkest.getGameMechanicsSchema");

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const lineText = line.text.trim();

      if (i === 0 && lineText.startsWith("// @darkest-nocheck")) {
        break;
      } else if (lineText.startsWith("// @darkest-ignore")) {
        i++;
        continue;
      }

      if (!lineText || lineText.startsWith("//")) {
        continue;
      }

      const isNumericToken = "(?:[+-]?\\d+(?:\\.\\d+)?%?|[+-]?\\.\\d+%?)";
      const isValueToken = `(?:"(?:\\\\.|[^"\\\\])*"|${isNumericToken}|[^\\s.]+)`;
      const isLineValid = new RegExp(`^\\w+:\\s*\\.[a-zA-Z0-9_]+(?:\\s+${isValueToken})*(?:\\s*\\.[a-zA-Z0-9_]+(?:\\s+${isValueToken})*)*\\s*$`).test(lineText);
      if (!isLineValid) {
        const diagnostic = new vscode.Diagnostic(
          line.range,
          `Invalid syntax: \`${line.text}\``,
          vscode.DiagnosticSeverity.Error
        );
        diagnostics.push(diagnostic);
        continue;
      }

      const keyword = line.text.match(/\w+(?=:)/)?.[0]!;

      if (!gameMechanicsSchema[keyword]) {
        const diagnostic = new vscode.Diagnostic(
          line.range,
          `Unknown keyword: \`${keyword}\``,
          vscode.DiagnosticSeverity.Error
        );
        diagnostics.push(diagnostic);
        continue;
      }

      const paramsAndValues = [...lineText.matchAll(/(\.[a-zA-Z0-9_]+)((?:\s+(?:"(?:\\.|[^"\\])*"|[+-]?\d+(?:\.\d+)?%?|[+-]?\.\d+%?|[^\s.]+))*)/g)]
        .map(match => match[0]);

      const missingParams = Object.entries(gameMechanicsSchema[keyword])
        .filter(([, s]) => "required" in s && s.required)
        .filter(([param]) =>
          paramsAndValues.every(
            (paramAndValue) => !paramAndValue.startsWith(param)
          )
        );

      if (missingParams.length > 0) {
        const missingParamsString = missingParams
          .map(([param]) => `\`${param}\``)
          .join(", ");
        const diagnostic = new vscode.Diagnostic(
          line.range,
          `Missing required parameters: ${missingParamsString}`,
          vscode.DiagnosticSeverity.Error
        );
        diagnostics.push(diagnostic);
        continue;
      }

      paramsAndValues?.forEach((paramAndValue) => {
        const [param, ...values] = paramAndValue.split(/\s+/);
        const index = line.text.indexOf(paramAndValue);
        if (!gameMechanicsSchema[keyword][param]) {
          const diagnostic = new vscode.Diagnostic(
            new vscode.Range(
              line.lineNumber,
              index,
              line.lineNumber,
              index + paramAndValue.length
            ),
            `Unknown parameter \`${param}\` for ${keyword}`,
            vscode.DiagnosticSeverity.Error
          );
          diagnostics.push(diagnostic);
        } else {
          let expectedType = "";
          if(checkIfMonsterFile() === true){
            const monsterType = gameMechanicsSchema[keyword][param].monsterType;
            expectedType = monsterType || gameMechanicsSchema[keyword][param].type;
          }
          else{
            expectedType = gameMechanicsSchema[keyword][param].type;
          }
          const allowedValues = gameMechanicsSchema[keyword][param].allowed_values;
          const value = values.join(" ").trim();
          const valueValidation = validator(value, expectedType);
          const isAllowed = isAllowedValue(value, allowedValues);
          const canBeNull = gameMechanicsSchema[keyword][param].canBeNull;
          const isEmptyDynamicModeEffects =
            value.length === 0 &&
            param.endsWith("_effects") &&
            modes.some((mode) => param === `.${mode}_effects`);
          const isEmptyEffectsList = value.length === 0 && param === ".effects";
          const isIntentionallyBlankParameter =
            value.length === 0 &&
            (param === ".effect" ||
              param === ".target" ||
              isEmptyDynamicModeEffects ||
              isEmptyEffectsList);

          if (isIntentionallyBlankParameter) {
            const warningMessage = isEmptyDynamicModeEffects || isEmptyEffectsList
              ? `No effect IDs provided for \`${param}\`. This may be intentional.`
              : `No value provided for \`${param}\`. This may be intentional.`;
            const diagnostic = new vscode.Diagnostic(
              new vscode.Range(
                line.lineNumber,
                index,
                line.lineNumber,
                index + paramAndValue.length
              ),
              warningMessage,
              vscode.DiagnosticSeverity.Warning
            );
            diagnostics.push(diagnostic);
          } else if (
            keyword === "display_modifier" &&
            param === ".disabled_popup_text_types" &&
            !isAllowed
          ) {
            const listText = paramAndValue.slice(param.length);
            const tokenPattern = /"(?:\\.|[^"\\])*"|[^\s]+/g;
            let token: RegExpExecArray | null;
            while ((token = tokenPattern.exec(listText)) !== null) {
              let tokenValue = token[0];
              const quoted = tokenValue.startsWith('"') && tokenValue.endsWith('"');
              if (quoted) {
                try { tokenValue = JSON.parse(tokenValue) as string; } catch { /* Keep the raw token for diagnostics. */ }
              }
              if (allowedValues?.some(allowed => String(allowed) === tokenValue)) continue;
              const tokenStart = index + param.length + token.index + (quoted ? 1 : 0);
              const tokenEnd = tokenStart + token[0].length - (quoted ? 2 : 0);
              diagnostics.push(new vscode.Diagnostic(
                new vscode.Range(line.lineNumber, tokenStart, line.lineNumber, tokenEnd),
                `Unknown display_modifier value \`${tokenValue}\`.`,
                vscode.DiagnosticSeverity.Warning,
              ));
            }
          } else if ((!valueValidation.isValid || !isAllowed) && !canBeNull) {
            const diagnostic = new vscode.Diagnostic(
              new vscode.Range(
                line.lineNumber,
                index,
                line.lineNumber,
                index + paramAndValue.length
              ),
              `${valueValidation.message} ${
                !isAllowed
                  ? `Allowed values: \`${allowedValues?.join(", ")}\``
                  : ""
              }`,
              vscode.DiagnosticSeverity.Error
            );
            diagnostics.push(diagnostic);
          }
        }
      });
    }
    collection.set(document.uri, diagnostics);
  }
}

const throttledUpdateDiagnostics = throttle(
  (document: vscode.TextDocument, collection: vscode.DiagnosticCollection) => {
    updateDiagnostics(document, collection);
  },
  1000
);

const isAllowedValue = (value: any, allowedValues?: any[]) => {
  if (!allowedValues) {
    return true;
  }
  return value.split(" ").every((v: string) => {
    const normalizedValue = v.replace(/['"]/g, "");
    return allowedValues.map((v) => v.toString()).includes(normalizedValue);
  });
};

function checkIfMonsterFile(): boolean {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.uri.fsPath.includes("\\monsters\\") : false;
}
