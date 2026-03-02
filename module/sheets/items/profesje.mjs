import { _onEditText } from "../../utils.mjs";

const { api, sheets } = foundry.applications;

export class profesjeSheet extends api.HandlebarsApplicationMixin(
  sheets.ItemSheetV2,
) {
  constructor(...args) {
    super(...args);

    /** @type {CharacterActor} */
    this.item;
  }
  static DEFAULT_OPTIONS = {
    classes: ["profesje-sheet"],
    position: { width: 500, height: 850 },
    actions: {
      editText: _onEditText,
          dodajAtrybut: profesjeSheet._systemAction,
    usunAtrybut: profesjeSheet._systemAction,
    dodajCel: profesjeSheet._systemAction,
    usunCel: profesjeSheet._systemAction,
    dodajPrzedmiot: profesjeSheet._systemAction,
    usunPrzedmiot: profesjeSheet._systemAction,
    dodajUmiejetnosc: profesjeSheet._systemAction,
    usunUmiejetosc: profesjeSheet._systemAction,
    dodajRase: profesjeSheet._systemAction,
    usunRase: profesjeSheet._systemAction,
    otworzRase: profesjeSheet._systemAction,
    },
    form: {
      submitOnChange: true,
    },
  };
  static PARTS = {
    tabs: {
      id: "tabs",
      template: `systems/wiedzmin_yze/templates/items/profesje.hbs`,
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
    context.ekwipunek = {
      value: this.item.system.ekwipunek,
      enriched: await enrich(this.item.system.ekwipunek),
      field: this.item.system.schema.fields.ekwipunek,
    };

    return context;
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
  async _systemAction(event) {
  const target = event.target;
  const action = target.dataset.action;
  const id = target.dataset?.id;

  const fn = this.item.system[action];

  if (typeof fn !== "function") {
    console.warn(`System method '${action}' does not exist`);
    return;
  }

  if (id !== undefined) {
    await fn.call(this.item.system, id);
  } else {
    await fn.call(this.item.system);
  }
}
}
