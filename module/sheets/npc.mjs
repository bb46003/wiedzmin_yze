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
      atakZTabeli: NPCSheet.#atakZTabeli
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
    const zdolnosci = await this.prepareZdolnosci()
     Object.assign(context, {zdolnosci});
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
    async  enrich(html) {
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
  static async #dodajAZ(ev){
    const target = ev.target;
    const type = target.dataset.type;
    await this.actor.system.dodajAZ(type)
  }
static async #atakZTabeli(){
  const uuidTabeli = this.actor.system.tabela_atakow;
  const tabela = await fromUuid(uuidTabeli);
  await tabela.draw({ displayChat: true });
}
  async _onDrop(event) {
    event.preventDefault();

    const data = event.dataTransfer;
    const actor = this.actor;
    let stworzPrzedmiot = false;
    if (!data) return;

    const droppedItem = JSON.parse(data.getData("text/plain"));


    const itemDoc = await fromUuid(droppedItem.uuid);
    let itemData = itemDoc.toObject(); // IMPORTANT
    if(!itemData.type){
      itemData.type = droppedItem.type;
    }
   console.log(itemData.type)
    switch (itemData.type) {
      case "RollTable":
        await this.actor.update({"system.tabela_atakow": droppedItem.uuid})
        break;
      case "bron":
        const bronName = itemData.name;
        await this.actor.system.dodajAZ("ataki", bronName)
        break;
    }
  }
}
