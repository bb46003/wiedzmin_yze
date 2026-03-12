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
      usunTalent: profesjeSheet._systemAction,
      otworzPrzedmiot: profesjeSheet.#otworzPrzedmiot,
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

  _onDragOver(event) {}
  async _onDrop(event) {
    const data = event.dataTransfer;
    const profesja = this.item;
    if (data) {
      const droppedItem = JSON.parse(data.getData("text/plain"));
      const droppedType = droppedItem.type;
      const item = await fromUuid(droppedItem.uuid);
      switch (item.type) {
        case "talenty":
          if (droppedType === "Item" && item.system?.kosztTalentu === 0) {
            const uuid = item.uuid;
            const itemName = item.name;
            await profesja.system._dodajTalent(uuid, itemName);
          } else {
             ui.notifications.warn("wiedzmin.warrning.talenetPosiadaKoszt");
          }
          break;
        case "rasa":
          if (droppedType === "Item") {
            const uuid = item.uuid;
            const itemName = item.name;
            await profesja.system._dodajRase(uuid, itemName);
          }
          break;
      }
    }
  }

  async _onRender(document, options) {
    await super._onRender(document, options);
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

    const id = document.rootId;
    const element = document.document.apps[id].element;

    // --------- 1. Atrybuty Wiodące ---------
    const divAtrybuty = element.querySelector(".atrybut-wiodacy");
    if (divAtrybuty) {
      const atrybutyGroups = divAtrybuty.querySelectorAll(".form-grup");
      const atrybutySelects = [...atrybutyGroups]
        .map((g) => g.querySelector("select"))
        .filter(Boolean);

      if (atrybutySelects.length > 0) {
        const allAtrybutValues = [...atrybutySelects[0].options].map(
          (o) => o.value,
        );

        atrybutySelects.forEach((currentSelect) => {
          const otherValues = atrybutySelects
            .filter((s) => s !== currentSelect)
            .map((s) => s.value)
            .filter((v) => v !== "");

          [...currentSelect.options].forEach((option) => {
            option.disabled = otherValues.includes(option.value);
          });

          if (otherValues.includes(currentSelect.value)) {
            const freeValue = allAtrybutValues.find(
              (v) => !otherValues.includes(v),
            );
            if (freeValue) currentSelect.value = freeValue;
          }
        });
      }

      // --------- 2. Umiejętności Zawodowe ---------
      const divUmiejetnosci = element.querySelector(".ogranicznie");
      if (divUmiejetnosci) {
        const umiejkaSelects = [
          ...divUmiejetnosci.querySelectorAll(".umiejtenosci-zawodowe select"),
        ].filter(Boolean);

        if (umiejkaSelects.length > 0) {
          const allUmiejkaValues = [...umiejkaSelects[0].options].map(
            (o) => o.value,
          );

          umiejkaSelects.forEach((currentSelect) => {
            const otherValues = umiejkaSelects
              .filter((s) => s !== currentSelect)
              .map((s) => s.value)
              .filter((v) => v !== "");

            [...currentSelect.options].forEach((option) => {
              option.disabled = otherValues.includes(option.value);
            });

            if (otherValues.includes(currentSelect.value)) {
              const freeValue = allUmiejkaValues.find(
                (v) => !otherValues.includes(v),
              );
              if (freeValue) currentSelect.value = freeValue;
            }
          });
        }
      }
    }
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
    const id = document.rootId;
    const element = document.document.apps[id].element;

    // --------- 1. Atrybuty Wiodące ---------
    const divAtrybuty = element.querySelector(".atrybut-wiodacy");
    if (divAtrybuty) {
      const atrybutyGroups = divAtrybuty.querySelectorAll(".form-grup");
      const atrybutySelects = [...atrybutyGroups]
        .map((g) => g.querySelector("select"))
        .filter(Boolean);

      if (atrybutySelects.length > 0) {
        const allAtrybutValues = [...atrybutySelects[0].options].map(
          (o) => o.value,
        );

        atrybutySelects.forEach((currentSelect) => {
          const otherValues = atrybutySelects
            .filter((s) => s !== currentSelect)
            .map((s) => s.value)
            .filter((v) => v !== "");

          [...currentSelect.options].forEach((option) => {
            option.disabled = otherValues.includes(option.value);
          });

          if (otherValues.includes(currentSelect.value)) {
            const freeValue = allAtrybutValues.find(
              (v) => !otherValues.includes(v),
            );
            if (freeValue) currentSelect.value = freeValue;
          }
        });
      }
    }

    // --------- 2. Umiejętności Zawodowe ---------
    const divUmiejetnosci = element.querySelector(".ogranicznie");
    if (divUmiejetnosci) {
      const umiejkaSelects = [
        ...divUmiejetnosci.querySelectorAll(".umiejtenosci-zawodowe select"),
      ].filter(Boolean);

      if (umiejkaSelects.length > 0) {
        const allUmiejkaValues = [...umiejkaSelects[0].options].map(
          (o) => o.value,
        );

        umiejkaSelects.forEach((currentSelect) => {
          const otherValues = umiejkaSelects
            .filter((s) => s !== currentSelect)
            .map((s) => s.value)
            .filter((v) => v !== "");

          [...currentSelect.options].forEach((option) => {
            option.disabled = otherValues.includes(option.value);
          });

          if (otherValues.includes(currentSelect.value)) {
            const freeValue = allUmiejkaValues.find(
              (v) => !otherValues.includes(v),
            );
            if (freeValue) currentSelect.value = freeValue;
          }
        });
      }
    }
  }
  static async _systemAction(event) {
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
  static async #otworzPrzedmiot(event) {
    const target = event.target;
    const uuid = target.dataset.id;
    const talent = await fromUuid(uuid);
    talent.sheet.render({ force: true });
  }
}
