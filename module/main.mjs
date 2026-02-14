import { postacDataModel } from "./data-model/postac.mjs";
import { postac } from "./sheets/postac.mjs";
import { registerHandlebarsHelpers } from "./handlebars.mjs";
import { postacActor } from "./actors/postac.mjs";
import { registerSystemSheet } from "./utils.mjs";
Hooks.once("init", async function () {
  CONFIG.Actor.documentClass = postacActor;

  CONFIG.Actor.dataModels = {
    postac: postacDataModel,
  };

  foundry.applications.apps.DocumentSheetConfig.unregisterSheet(
    foundry.documents.Actor,
    "core",
    foundry.applications.sheets.ActorSheet,
  );

  registerSystemSheet(foundry.documents.Actor, postac, "postac");
  registerHandlebarsHelpers();
  const templates = [
    "systems/wiedzmin_yze/templates/postac/header.hbs",
    "systems/wiedzmin_yze/templates/postac/resources.hbs",
    "systems/wiedzmin_yze/templates/postac/conditions.hbs",
    "systems/wiedzmin_yze/templates/postac/weapons.hbs",
    "systems/wiedzmin_yze/templates/postac/attributes.hbs",
    "systems/wiedzmin_yze/templates/postac/talents.hbs",
    "systems/wiedzmin_yze/templates/postac/equipment.hbs",
    "systems/wiedzmin_yze/templates/postac/notes.hbs",
  ];

  foundry.applications.handlebars.loadTemplates(templates);

  console.log("Wiedzmin YZE został zainicjiwany");
});
