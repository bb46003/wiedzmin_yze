import { _onEditText } from "../../utils.mjs";

const { api, sheets } = foundry.applications;

export class rasaSheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2,
) {
  constructor(...args) {
    super(...args);

    /** @type {CharacterActor} */
    this.item;
  }
  static DEFAULT_OPTIONS = {
    classes: ["rasa-sheet"],
    position: { width: 500, height: 850 },
    actions: {
      editText: _onEditText,
      otworzTalent: rasaSheet.#otworzTalent,
    },
    form: {
      submitOnChange: true,
    },
  };
  static PARTS = {
    tabs: {
      id: "tabs",
      template: `systems/wiedzmin_yze/templates/items/rasa.hbs`,
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
    context.talenty = await this._przygotujTalenty();
    return context;
  }
  async _przygotujTalenty() {
    const talenty = [];
    const rasa = this.item.system.talenty;
    rasa.forEach((talent) => {
      const dane = {
        name: talent.name,
        id: talent.uuid,
      };
      talenty.push(dane);
    });
    return talenty;
  }

  _canDragDrop(selector) {
    return game.user.isGM;
  }
  _canDragStart(selector) {
    return game.user.isGM;
  }
  async _onRender(context, options) {
    await super._onRender(context, options);
    new foundry.applications.ux.DragDrop.implementation({
      dragSelector: ".draggable",
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      },
    }).bind(this.element);
  }
  _onDragStart(event) {
    ui.context?.close({ animate: false });
    const target = event.currentTarget;
    const { pageId } = target.closest("[data-page-id]").dataset;
    const { anchor } = target.closest("[data-anchor]")?.dataset ?? {};
    const page = this.entry.pages.get(pageId);
    const dragData = {
      ...page.toDragData(),
      anchor: { slug: anchor, name: target.innerText },
    };
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }
  _onDragOver(event) {}
  async _onDrop(event) {
    const data = event.dataTransfer;
    const rasa = this.item;
    if (data) {
      const droppedItem = JSON.parse(data.getData("text/plain"));
      const droppedType = droppedItem.type;
      const telent = await fromUuid(droppedItem.uuid);
      if (droppedType === "Item" && telent.system.kosztTalentu === 0) {
        const uuid = telent.uuid;
        const itemName = telent.name;
        await rasa.system._dodajTalent(uuid, itemName);
      } else {
        ui.warrning("wiedzmin.warrning.talenetPosiadaKoszt");
      }
    }
  }

  static async #otworzTalent(ev) {
    const target = ev.target;
    const uuid = target.dataset.id;
    const talent = await fromUuid(uuid);
    talent.sheet.render({ force: true });
  }
}
