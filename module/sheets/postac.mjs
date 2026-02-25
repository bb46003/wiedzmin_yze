import { staticID, toLabelObject } from "../utils.mjs";

const { api, sheets } = foundry.applications;

export class postacSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2,
) {
  constructor(...args) {
    super(...args);

    /** @type {CharacterActor} */
    this.actor;
  }
  static DEFAULT_OPTIONS = {
    classes: ["postac-sheet"],
    position: { width: 970, height: 850 },
    actions: {
      toggleCondition: postacSheet._onToggleCondition,
      rzut_atrybut: postacSheet.#rzut_atrybut,
      rzut_umiejka: postacSheet.#rzut_umiejka,
      editText: postacSheet._onEditText,
      rzut_talen: postacSheet.#rzut_talen,
      itemContextMenu: postacSheet.#itemContextMenu,
      otwórzRase: postacSheet.#otwórzRase,
    },
    form: {
      submitOnChange: true,
    },
  };
  static PARTS = {
    tabs: {
      id: "tabs",
      template: `systems/wiedzmin_yze/templates/postac/glowna.hbs`,
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
    const { conditions } = await this._prepareConditions();
    Object.assign(context, { conditions });
    const talenty = await this.prepareTelenty();
    Object.assign(context, { talenty });
    const rasa = await this.prepareRasa();
    Object.assign(context, { rasa });
    return context;
  }

  /**
   * Prepare conditions for display.
   *
   * @returns {Promise<{ conditions: Record<string, unknown>[], specialConditions: Record<string, unknown>[] }>}
   */
  async _prepareConditions() {
    const allEffects = {
      ...wiedzmin_yze.config.CONDITIONS,
    };

    const conditions = Object.entries(allEffects)
      .filter(([, effect]) => effect.hud?.actorTypes?.includes("postac"))
      .map(([id, effect]) => {
        const { name, reference, img: icon } = effect;
        const docId = staticID(`wyze${id}`);
        const existingEffect = this.actor.effects.get(docId);
        const { active, img } = existingEffect ?? {};

        return {
          name: game.i18n.localize(name),
          img: img || icon || "icons/svg/mystery-man.svg",
          id,
          reference,
          disabled: !active,
          cssClass: [active ? "active" : ""].filterJoin(" "),
          combined: "conditions" in effect,
        };
      })
      .filter(Boolean);

    return { conditions };
  }

  async prepareTelenty() {
    const talenty = this.actor.items.filter((item) => item.type === "talenty");
    const data = {};
    talenty.forEach((talent) => {
      const itemID = talent.id;
      const iamge = talent.img;
      const itemName = talent.name;
      const rzucany = talent.system.rzucany;
      data[itemID] = {
        img: iamge,
        name: itemName,
        rzucany: rzucany,
      };
    });

    return data;
  }
  async prepareRasa() {
    const rasa = this.actor.items.filter((item) => item.type === "rasa")[0];
    if (rasa) {
      const data = { id: rasa.id, rasaName: rasa.name };

      return data;
    }
  }

  async _onDrop(event) {
    event.preventDefault();

    const data = event.dataTransfer;
    const actor = this.actor;
    let stworzPrzedmiot = false;
    if (!data) return;

    const droppedItem = JSON.parse(data.getData("text/plain"));
    if (droppedItem.type !== "Item") return;

    const itemDoc = await fromUuid(droppedItem.uuid);
    let itemData = itemDoc.toObject(); // IMPORTANT

    switch (itemData.type) {
      case "talenty": {
        const wydaneXp = itemData.system.kosztTalentu;

        actor.system.wydanieXP(wydaneXp, itemData);

        if (itemData.system.zwiekszneiePM) {
          actor.system.zwiekszMoc(itemData.system.dodatkowaMoc);
        }
        stworzPrzedmiot = true;
        break;
      }

      case "rasa": {
        const posiadanaRasa = actor.items.filter((i) => i.type === "rasa");
        const posiadanaProfesja = actor.items.filter(
          (i) => i.type === "profesja",
        );
        if (posiadanaRasa.length > 0) {
          ui.notifications.warn(
            "Postać posiada już rasę. Usuń ją zanim dodasz nową.",
          );
          return;
        }

        const powiazaneTalenty = itemData.system.talenty;

        for (let i = 0; i < powiazaneTalenty.length; i++) {
          const sourceTalent = await fromUuid(powiazaneTalenty[i].uuid);

          const created = await actor.createEmbeddedDocuments("Item", [
            sourceTalent.toObject(),
          ]);
          const newItem = created[0];
          itemData.system.talenty[i].uuid = newItem.uuid;
        }
        const podbicieAtrybutu = itemData.system.bonusyAtrybuty;
        this.actor.system._bonusZRasy(podbicieAtrybutu);
        if (
          itemData.system.zapewniaBonusDoUmiejki &&
          !item.system.wybieraneUmiejki
        ) {
          const podbicieUmiejki = itemData.system.bonusyUmiejki;
          this.actor.system._bonusZRasyUmiejka(podbicieUmiejki);
           stworzPrzedmiot = true;
        }
        if (itemData.system.wybieraneUmiejki) {
          const profesja = this.actor.items.filter((item) => {
            item.type === "profesja";
          })[0];
          const umiejki = toLabelObject(wiedzmin_yze.config.umiejki);
           stworzPrzedmiot = true;
        }
        if (itemData.system.wybieraneAtrybuty) {
          const iloscAtrybutow = itemData.system.iloscWybieranychAtrybutuow;
          const wartosc = itemData.system.bonusDoWybranych;
          const choices = {
            sila: game.i18n.localize("wiedzmin.atrubut.sila"),
            zrecznosc: game.i18n.localize("wiedzmin.atrubut.zrecznosc"),
            empatia: game.i18n.localize("wiedzmin.atrubut.empatia"),
            rozum: game.i18n.localize("wiedzmin.atrubut.rozum"),
          };
          const wybory = [];
          for (let i = 0; i < iloscAtrybutow; i++) {
            const dane = { lista: choices, wartosc: wartosc };
            wybory.push(dane);
          }
          const content = await foundry.applications.handlebars.renderTemplate(
            "systems/wiedzmin_yze/templates/dialogs/przydziel-atrybuty.hbs",
            {
              wybory: wybory,
            },
          );
          const dialog = new foundry.applications.api.DialogV2({
            window: { title: "Wiedzmin Roll" },
            content,
            buttons: [
              {
                label: "zastosuj",
                action: "zastosuj",
                default: true,
                callback: async (_event, _button, dialog) => {
                  const atrybuty = dialog.element.querySelectorAll(".atrybuty");
                  const wartosc = dialog.element.querySelector(".wartosc");
                  const dane = [];
                  atrybuty.forEach((atr, index) => {
                    const data = {
                      bonus: wartosc.innerHTML,
                      atrybut: atr.value,
                    };
                    dane.push(data);
                    itemData.system.bonusyAtrybuty[index]= data;
                  });
                  this.actor.system._bonusZRasy(dane);
                  await actor.createEmbeddedDocuments("Item", [itemData]);
                },
              },
            ],
          });
          dialog.render({ force: true });
        }

        break;
      }
    }

    if( stworzPrzedmiot ){
    await actor.createEmbeddedDocuments("Item", [itemData]);
    }
  }
  /** @inheritDoc */
  _processFormData(event, form, formData) {
    const name = event?.target?.name;

    // Jeśli kliknięto jeden z naszych checkboxów
    if (
      name === "system.adrenalina.value" ||
      name === "system.zycie.value" ||
      name === "system.punkty_mocy.value"
    ) {
      const value = Number(event.target.value);
      formData.object[name] = event.target.checked ? value : value - 1;
    }

    if (name !== "system.adrenalina.value") {
      const inputsAdrenalina = Array.from(
        form.querySelectorAll("[name='system.adrenalina.value']"),
      );
      formData.object["system.adrenalina.value"] =
        this.getMax(inputsAdrenalina);
    }
    if (name !== "system.zycie.value") {
      const inputsZycie = Array.from(
        form.querySelectorAll("[name='system.zycie.value']"),
      );
      formData.object["system.zycie.value"] = this.getMax(inputsZycie);
    }
    if (name !== "system.punkty_mocy.value") {
      const inputsMoc = Array.from(
        form.querySelectorAll("[name='system.punkty_mocy.value']"),
      );
      formData.object["system.punkty_mocy.value"] = this.getMax(inputsMoc);
    }
    return super._processFormData(event, form, formData);
  }

  getMax(inputs) {
    // Convert to objects with numeric value and checked status
    const values = inputs.map((input) => ({
      value: Number(input.value),
      checked: input.checked,
    }));

    // Sort by numeric value ascending
    values.sort((a, b) => a.value - b.value);

    let maxValue = 0; // Default if none checked in sequence

    for (const item of values) {
      if (item.checked) {
        maxValue = item.value; // update max as long as sequence continues
      } else {
        break; // first unchecked stops the sequence
      }
    }

    return maxValue;
  }
  /**
   * Toggle a single condition, either enabling and adding it to the actor, or disabling and removing it.
   *
   * @this {CharacterSheetMM3}}
   * @param {PointerEvent} event
   */
  static async _onToggleCondition(event) {
    const conditionId = event.target.closest("[data-condition-id]")?.dataset
      .conditionId;
    return this.actor.toggleStatusEffect(conditionId);
  }

  static async #rzut_umiejka(ev) {
    const umiejka = ev.target.dataset.umiejka;
    const atrybut = ev.target.dataset.atrybut;
    this.actor.system.rzutUmiejka(umiejka, atrybut);
  }

  static async #rzut_atrybut(ev) {
    const atrybut = ev.target.dataset.atrybut;
    this.actor.system.rzutAtrybut(atrybut);
  }
  static async #rzut_talen(ev) {
    const target = ev.target;
    const itemID = target.parentNode.dataset.item;
    const item = [this.actor.items.get(itemID)];
    const atrybut = item.system.powiazaneAtrybuty;
    this.actor.system.rzutAtrybut(atrybut, item);
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
    if (item.type === "talenty") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Talent</div>
    <div class="menu-option" data-action="delete">Usuń Talent</div>
  `;
    }
    if (item.type === "rasa") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Rase</div>
    <div class="menu-option" data-action="delete">Usuń Rase</div>
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
        if (item.type === "talenty") {
          const xp = item.system.kosztTalentu;
          await this.actor.system.zwrocPD(xp, item);
          if (item.system.zwiekszneiePM) {
            await this.actor.system.zmniejszneieMocy(item.system.dodatkowaMoc);
          }
        }
        if (item.type === "rasa") {
          const podbicieAtrybutu = item.system.bonusyAtrybuty;
          this.actor.system._bonusZRasyUsun(podbicieAtrybutu);
          if (item.system.zapewniaBonusDoUmiejki) {
            const podbicieUmiejki = item.system.bonusyUmiejki;
            this.actor.system._bonusZRasyUmiejkaUsun(podbicieUmiejki);
          }
        }
        await item?.delete();
      }

      menu.remove();
    });

    // Close when clicking elsewhere
    setTimeout(() => {
      document.addEventListener("click", () => menu.remove(), { once: true });
    }, 10);
  }

  static async #otwórzRase(ev) {
    const target = ev.target;
    const rasaID = target.dataset.id;
    const rasa = this.actor.items.get(rasaID);
    rasa.sheet.render({ force: true });
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
