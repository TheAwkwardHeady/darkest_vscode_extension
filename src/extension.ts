import * as vscode from "vscode";
import { GAME_MECHANICS_SCHEMA, Sources } from "./game-mechanics-schema";
import { throttle } from "./utils/throttle";
import { isStringObject } from "util/types";
import { validator } from "./valueValidation";
import { gatherModes } from "./modeValidation";
import { checkIfEffectFile, addEffect, addEffectParameter } from "./effectCreation";
import { DarkestCompletionItemProvider } from "./completion-item-provider";
import { checkIfLocFile, updateZWSP, createZWSP, createTooltipString } from "./locTools";
import { checkIfBuffFile, createTooltipBuff, createBuff } from "./buffTools";

let modes: string[] = [];

const effectTriggerOrder = ".apply_with_result true -> .apply_with_result true on a Trinket -> Regular Effect -> Regular Effect on a Trinket -> .queue true -> .queue true on a Trinket";

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
  return editor ? editor.document.uri.fsPath.includes("\\monsters\\") : false;
}