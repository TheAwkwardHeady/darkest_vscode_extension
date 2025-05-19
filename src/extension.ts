import * as vscode from "vscode";
import { GAME_MECHANICS_SCHEMA } from "./game-mechanics-schema";
import { throttle } from "./utils/throttle";
import { validator } from "./valueValidation";
import { gatherModes } from "./modeValidation";
import { addEffect, addEffectParameter } from "./effectCreation";
import { DarkestCompletionItemProvider } from "./completion-item-provider";

let modes: string[] = [];

export function activate(context: vscode.ExtensionContext) {
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

      const isLineValid = /^\w+:(\s+\.[a-zA-Z0-9_]+(\s+[^\s.][^\s]*)*)+$/.test(
        lineText
      );
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

      const paramsAndValues = lineText.match(
        /(\.[a-zA-Z0-9_]+)(\s+[^\s.][^\s]*)*/g
      )!;

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
          if ((!valueValidation.isValid || !isAllowed) && !canBeNull) {
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
  if(editor){console.log(editor.document.uri.fsPath);}
  return editor ? editor.document.uri.fsPath.includes("\\monsters\\") : false;
}