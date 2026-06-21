import { staticID, toLabelObject } from "../utils.mjs";

const { api, sheets } = foundry.applications;

export class NPCSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2,
) {
  constructor(...args) {
    super(...args);

    /** @type {NPCSheet} */
    this.actor;
  }
  static DEFAULT_OPTIONS = {
    classes: ["postac-sheet", "npc"],
    position: { width: 820, height: 850 },
    actions: {
    },
    form: {
      submitOnChange: true,
    },
  };
  static PARTS = {
    tabs: {
      id: "tabs",
      template: `systems/wiedzmin_yze/templates/npc/wiedzmin-npc-header.hbs`,
    },
   
  };
  static TABS = {
    items: {
      tabs: [
        { id: "bronie", group: "items", label: "" },
        { id: "talenty", group: "items", label: "" },
        { id: "czary", group: "items", label: "" },
      ],
      initial: "bronie",
    },
  };
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, {
      actor: this.actor,
      source: this.actor.toObject(),
      system: this.actor.system,
      fields: this.actor.schema.fields,
      systemFields: this.actor.system.schema.fields,
    });
    async function enrich(html) {
      if (html) {
        return await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          html,
          {
            secrets: game.user.isOwner,
            async: true,
          },
        );
      } else {
        return html;
      }
    }
    context.opis = {
      value: this.actor.system.opis,
      enriched: await enrich(this.actor.system.opis),
      field: this.actor.system.schema.fields.opis,
    };
    return context;
  }
}
