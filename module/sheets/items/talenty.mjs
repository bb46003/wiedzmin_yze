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
      editText: talentySheet._onEditText,
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
    console.log("Context prepared for talentySheet:", context);
    return context;
  }
  static async _onEditText(_event, target) {
    const { fieldPath, propertyPath } = target.dataset;
    // If there is a document (e.g. an item) to be found in a parent element, assume the field is relative to that
    const doc = (await this.getDocument?.(target)) ?? this.document;
    // Get field from schema
    const field = doc.system.schema.getField(
      fieldPath.replace(/^system\./, "") ??
        propertyPath.replace(/^system\./, ""),
    );
    const editor = new TextEditorApplication({ document: doc, field });
    editor.render({ force: true });
  }
}
