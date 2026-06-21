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
      dodajAZ: NPCSheet.#dodajAZ
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
    main: {
      id: "tabs",
      template: "systems/wiedzmin_yze/templates/npc/wiedzmin-npc-main.hbs",
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
    context.systemFields.tabela_atakow.choices =
      await this.prepareTabeleLosowe();
    return context;
  }

  async prepareTabeleLosowe() {
    const tabele = game.tables;
    const data = {};
    if (tabele) {
      tabele.forEach((tabela) => {
        data[tabela.uuid] = tabela.name;
      });
    }
    return data;
  }
  static async #dodajAZ(ev){
    const target = ev.target;
    const type = target.dataset.type;
    await this.actor.system.dodsjAZ(type)
  }
}
