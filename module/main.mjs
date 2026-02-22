import { postacSheet } from "./sheets/postac.mjs";
import { registerHandlebarsHelpers } from "./handlebars.mjs";
import { postacActor } from "./document/actors/postac.mjs";
import * as utils from "./utils.mjs";
import { SYSTEM as config } from "./config/system.mjs";
import { ActiveEffectWiedzmin_YZE } from "./document/active-effect.mjs";
import * as models from "./data-model/_module.mjs";
import { WiedzminRoll } from "./roll/wiedzmin-roll.mjs";
import { addChatListeners } from "./chat/chat-button.mjs";
import { talentySheet } from "./sheets/items/talenty.mjs";
import { talentyItem } from "./document/tenty.mjs";

globalThis.wiedzmin_yze = {
  config: utils.moduleToObject(config),
  models,
  WiedzminRoll,
};
export { config };

Hooks.once("init", async function () {
  CONFIG.Actor.documentClass = postacActor;
  CONFIG.Item.documentClass = talentyItem;

  CONFIG.Actor.dataModels = {
    postac: models.postacDataModel,
  };
  CONFIG.Item.dataModels = {
    talenty: models.talentyDataModel,
  };

  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
    foundry.documents.Actor,
    "core",
    foundry.applications.sheets.ActorSheet,
  );
  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
    foundry.documents.Item,
    "core",
    foundry.applications.sheets.ItemSheetV2,
  );
  // Active Effect
  CONFIG.ActiveEffect.documentClass = ActiveEffectWiedzmin_YZE;
  CONFIG.ActiveEffect.dataModels = {
    condition: models.Condition,
  };
  CONFIG.ActiveEffect.legacyTransferral = false;
  ActiveEffectWiedzmin_YZE._configureStatusEffects();

  CONFIG.Dice.rolls.push(WiedzminRoll);

  utils.registerSystemSheet(foundry.documents.Actor, postacSheet, "postac");
  utils.registerSystemSheet(foundry.documents.Item, talentySheet, "talenty");

  registerHandlebarsHelpers();
  const templates = [
    "systems/wiedzmin_yze/templates/postac/resources.hbs",
    "systems/wiedzmin_yze/templates/postac/conditions.hbs",
    "systems/wiedzmin_yze/templates/postac/weapons.hbs",
    "systems/wiedzmin_yze/templates/postac/attributes.hbs",
    "systems/wiedzmin_yze/templates/postac/talents.hbs",
    "systems/wiedzmin_yze/templates/postac/equipment.hbs",
    "systems/wiedzmin_yze/templates/postac/notes.hbs",
    "systems/wiedzmin_yze/templates/items/talenty-opcje.hbs",
  ];

  foundry.applications.handlebars.loadTemplates(templates);

  console.log("Wiedzmin YZE został zainicjiwany");
});
Hooks.on("renderChatMessageHTML", addChatListeners);
