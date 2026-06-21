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
import { rasaSheet } from "./sheets/items/rasa.mjs";
import { profesjeSheet } from "./sheets/items/profesje.mjs";
import { bronSheet } from "./sheets/items/bron.mjs";
import { pancerzSheet } from "./sheets/items/pancerz.mjs";
import { WiedzminTokenRuler } from "./token-ruler.mjs";
import { czarSheet } from "./sheets/items/czar.mjs";
import { WiedzminRegionDocument } from "./document/region.mjs";
import { SocketHandler } from "./socketHandler.mjs";
import { Wiedzmin_YZE_Adrenalina_Dice, Wiedzmin_YZE_Dice } from "./wiedzmin_dice.mjs";
import { wiedzmin_yze_Combar } from "./document/combat.mjs";
import { NPCSheet } from "./sheets/npc.mjs";

globalThis.wiedzmin_yze = {
  config: utils.moduleToObject(config),
  models,
  WiedzminRoll,
};
export { config };

Hooks.once("init", async function () {
  CONFIG.Actor.documentClass = postacActor;
  CONFIG.Item.documentClass = talentyItem;
  CONFIG.Region.documentClass = WiedzminRegionDocument;

  CONFIG.Actor.dataModels = {
    postac: models.postacDataModel,
    npc: models.NPCDataModel
  };
  CONFIG.Item.dataModels = {
    talenty: models.talentyDataModel,
    rasa: models.rasaDataModel,
    profesja: models.profesjaDataModel,
    bron: models.bronDataModel,
    pancerz: models.pancerzDataModel,
    czar: models.czarDataModel,
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
    wiedzmin_YZE: models.Condition,
  };
  CONFIG.ActiveEffect.legacyTransferral = false;
  ActiveEffectWiedzmin_YZE._configureStatusEffects();
	CONFIG.Combat.documentClass = wiedzmin_yze_Combar;
  CONFIG.Dice.rolls.push(WiedzminRoll);
  CONFIG.Token.rulerClass = WiedzminTokenRuler;
  utils.registerSystemSheet(foundry.documents.Actor, postacSheet, "postac");
  utils.registerSystemSheet(foundry.documents.Actor, NPCSheet,"npc");
  utils.registerSystemSheet(foundry.documents.Item, talentySheet, "talenty");
  utils.registerSystemSheet(foundry.documents.Item, rasaSheet, "rasa");
  utils.registerSystemSheet(foundry.documents.Item, profesjeSheet, "profesja");
  utils.registerSystemSheet(foundry.documents.Item, bronSheet, "bron");
  utils.registerSystemSheet(foundry.documents.Item, pancerzSheet, "pancerz");
  utils.registerSystemSheet(foundry.documents.Item, czarSheet, "czar");

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
    "systems/wiedzmin_yze/templates/chat/wiedzmin-kosci.hbs"
  ];

  foundry.applications.handlebars.loadTemplates(templates);
  game.wiedzmin_YZE = {socketHandler: new SocketHandler()};
 CONFIG.Dice.terms["n"] = Wiedzmin_YZE_Dice;
  CONFIG.Dice.terms["a"] = Wiedzmin_YZE_Adrenalina_Dice;
  console.log("Wiedzmin YZE został zainicjiwany");
});
Hooks.on("renderChatMessageHTML", addChatListeners);
Hooks.on("preCreateScene", (scene) => {
  scene.updateSource({
    tokenVision: true,
    fog: {
      exploration: true,
    },
    environment: {
      globalLight: {
        enabled: true,
      },
    },
  });
});
Hooks.on("clientSettingChanged", (setting) => {
  if (setting === "core.uiConfig") {
    for (const actor of game.actors.contents) {
      if (actor.isOwner) {
        if (actor.sheet.rendered) {
          actor.sheet.render({ force: true });
        }
      }
    }
  }
});


Hooks.on("renderTokenHUD", (hud, html) => {
  const palette = html.querySelector('.palette.status-effects');
  if (!palette) return;

  // prevent duplicates
  if (palette.querySelector('.wiedzmin-header-effects')) return;

  // create header
  const header = document.createElement("div");
  header.className = "wiedzmin-header-effects";
  header.textContent = "Statusy z Wiedzmina";



  // find first custom effect
  const firstCustom = palette.querySelector('[data-status-id="glod"]');

  if (firstCustom) {
    palette.insertBefore(header, firstCustom);
  } else {
    palette.appendChild(header);
  }
  palette.style.height = "285px"
});

Hooks.once("ready", async () => {
  const currentLang = game.settings.get("core", "language");

  if (currentLang !== "pl") {
    console.log(`Language is ${currentLang}, switching to Polish...`);

    await game.settings.set("core", "language", "pl");

    // reload to apply changes
    window.location.reload();
  }
});

		Hooks.once("diceSoNiceReady", async dice3d => {
			dice3d.addSystem({ id: "wiedzmin_yze", name: "Wiedzmin YZE" }, true);

			dice3d.addColorset({
				name: "wiedzmin_yze",
				description: "Wiedzmin YZE Normal Dice",
				category: "Colors",
				foreground: "#ffffff",
				background: "#000000",
				outline: "gray",
				texture: "none",
			});

			dice3d.addDicePreset({
				type: "dn",
				labels: [
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/white_wither.webp",
				],
				system: "wiedzmin_yze",

			},"d6");
      dice3d.addDicePreset({
				type: "da",
				labels: [
					"systems/wiedzmin_yze/assets/wild_gone.webp",
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/black.webp",
					"systems/wiedzmin_yze/assets/red_wither.webp",
				],
				system: "wiedzmin_yze",

			},"d6");
        })