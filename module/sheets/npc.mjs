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
      dodajAZ: NPCSheet.#dodajAZ,
      atakZTabeli: NPCSheet.#atakZTabeli,
      itemContextMenu: NPCSheet.#itemContextMenu,
      usun: NPCSheet.#usun,
      rzut: NPCSheet.#rzut,
      doCzatu: NPCSheet.#doCzatu,
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

    context.opis = {
      value: this.actor.system.opis,
      enriched: await this.enrich(this.actor.system.opis),
      field: this.actor.system.schema.fields.opis,
    };
    context.systemFields.tabela_atakow.choices =
      await this.prepareTabeleLosowe();
    const zdolnosci = await this.prepareZdolnosci();
    Object.assign(context, { zdolnosci });
    const czary = await this.prepareCzary();
    Object.assign(context, { czary });
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
  async prepareZdolnosci() {
    const zdolnosci = this.actor.system.zdolnosci ?? [];
    const fields = this.actor.system.schema.fields.zdolnosci.element.fields;

    const data = [];

    for (const zdolnosc of zdolnosci) {
      data.push({
        nazwa: {
          value: zdolnosc.nazwa,
          field: fields.nazwa,
        },
        opis: {
          value: zdolnosc.opis,
          enriched: await this.enrich(zdolnosc.opis),
          field: fields.opis,
        },
      });
    }

    return data;
  }
  async prepareCzary() {
    const czary = this.actor.items.filter((item) => item.type === "czar");
    const data = {};
    czary.forEach((czar) => {
      const itemID = czar.id;
      const img = czar.img;
      const name = czar.name;
      const poziom = czar.system.poziom;
      const koszt = czar.system.koszt;
      const zasieg = czar.system.zasieg;

      data[itemID] = {
        img,
        name,
        poziom,
        koszt,
        zasieg,
      };
    });

    return data;
  }
  async enrich(html) {
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
  static async #dodajAZ(ev) {
    const target = ev.target;
    const type = target.dataset.type;
    await this.actor.system.dodajAZ(type);
  }
  static async #atakZTabeli() {
    const uuidTabeli = this.actor.system.tabela_atakow;
    const tabela = await fromUuid(uuidTabeli);
    await tabela.draw({ displayChat: true });
  }
 
  static async #itemContextMenu(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    const button = ev.target;
    const itemId = button.parentElement.dataset.item;
    const item = this.actor.items.get(itemId);
    // Remove old menu if exists
    document.querySelector(".custom-context-menu")?.remove();

    // Create element instead of raw string (safer and cleaner)
    const menu = document.createElement("div");
    menu.classList.add("custom-context-menu");

    if (item.type === "czar") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Czar</div>
    <div class="menu-option" data-action="delete">Usuń Czar</div>
  `;
    }

    // Position at mouse location
    menu.style.position = "absolute";
    menu.style.left = `${ev.pageX}px`;
    menu.style.top = `${ev.pageY}px`;
    menu.style.zIndex = 1000;

    document.body.appendChild(menu);

    // Attach click handler
    menu.addEventListener("click", async (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      if (action === "open") {
        const item = this.actor.items.get(itemId);
        item?.sheet.render(true);
      }

      if (action === "delete") {
        const item = this.actor.items.get(itemId);
        await item?.delete();
        const index = button.dataset.index;
        await this.actor.system.usunAZ("czary", index);

      }

      menu.remove();
    });

    // Close when clicking elsewhere
    setTimeout(() => {
      document.addEventListener("click", () => menu.remove(), { once: true });
    }, 10);
  }

  static async #usun(ev) {
    const target = ev.target;
    const itemId = target.dataset?.item;
    const type = target.dataset.type;
    const index = target.dataset.index;
    if (itemId) {
      const item = this.actor.items.get(itemId);
      await item?.delete();
    }
    await this.actor.system.usunAZ(type, index);
  }
  static async #rzut(ev) {
    const target = ev.target;
    const type = target.dataset.type;
    let id = "";
    let item;
    if(type === "czary"){
      id = target.dataset.id
      item = await this.actor.items.get(id);
    }
    const index = Number(target.dataset.index);
    await this.actor.system.NPCRzut(type, item, index);
  }
  static async #doCzatu(ev) {}
   async _onDrop(event) {
    event.preventDefault();

    const data = event.dataTransfer;
    const actor = this.actor;
    let stworzPrzedmiot = false;
    if (!data) return;

    const droppedItem = JSON.parse(data.getData("text/plain"));

    const itemDoc = await fromUuid(droppedItem.uuid);
    let itemData = itemDoc.toObject(); // IMPORTANT
    if (!itemData.type) {
      itemData.type = droppedItem.type;
    }
     const bronName = itemData.name;
    switch (itemData.type) {
      case "RollTable":
        await this.actor.update({ "system.tabela_atakow": droppedItem.uuid });
        break;
      case "bron":
       
        await this.actor.system.dodajAZ("ataki", bronName);
        break;
      case "czar":
        const zadajeObrazenia = itemData.system?.obrazenia?.zadajeObrazenia;
        let obrazenia = 0;
        if (zadajeObrazenia) {
          obrazenia = itemData.system?.obrazenia?.podstawowe;
        }
        const czar = await actor.createEmbeddedDocuments("Item", [itemData]);
        await this.actor.system.dodajAZ("czary", bronName, obrazenia, czar[0].id);
        break;
    }
  }
_processFormData(event, form, formData) {
   const target = event?.target;
  const name = target?.name;
  const data = { object: {} };
  if (typeof name === "string") {
    data.object[name] = target?.value;
  }

  const match = name.match(/^system\.(ataki|czary|zdolnosci)\./);
  if (!match) {
    return super._processFormData(event, form, data);
  }

  const [, rootKey] = match;
  const split = name.split(".");
  const index = Number(split[2]);

  // current full object (e.g. one "atak")
  const current = this.actor.system[rootKey]?.[index];


  // 🔥 fill missing fields
  for (const key in current) {
    const fullPath = `system.${rootKey}.${index}.${key}`;

    // if this field was NOT changed → inject old value
    if (!(fullPath in formData)) {
      if(fullPath !== name){
      data.object[fullPath] = current[key];
      }
    }
  }

  return super._processFormData(event, form, data);
}
}

