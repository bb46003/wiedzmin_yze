import { _onEditText } from "../../utils.mjs";

const { api, sheets } = foundry.applications;

export class talentySheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2,
) {
  constructor(...args) {
    super(...args);

    /** @type {CharacterActor} */
    this.item;
  }
  static DEFAULT_OPTIONS = {
    classes: ["talenty-sheet"],
    position: { width: 500, height: 850 },
    actions: {
      editText: _onEditText,
    },
    form: {
      submitOnChange: true,
    },
  };
  static PARTS = {
    tabs: {
      id: "tabs",
      template: `systems/wiedzmin_yze/templates/items/talenty.hbs`,
    },
    opcje: {
      id: "opcje",
      template: `systems/wiedzmin_yze/templates/items/talenty-opcje.hbs`,
    },
  };
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, {
      item: this.item,
      source: this.item.toObject(),
      system: this.item.system,
      fields: this.item.schema.fields,
      systemFields: this.item.system.schema.fields,
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
      value: this.item.system.opis,
      enriched: await enrich(this.item.system.opis),
      field: this.item.system.schema.fields.opis,
    };

    return context;
  }

  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    const target = event.target;
    if (target.name === "system.powiazanaUmiejka" && target.value !== "") {
      const powiazanyAtrybut =
        wiedzmin_yze.config.umiejki[target.value].atrybKey;
      data.system.powiazaneAtrybuty = powiazanyAtrybut;
    }
    if(target.name === "system.zapewniaBonus" && !target.checked){
      data.system.dodatkoweForsowanie = false;
      data.system.zapewniaBonus = false;
    }
    if(target.name === "system.dodatkoweForsowanie" && target.checked){
      data.system.zapewniaBonus = true;
    }
    return data;
  }
}
