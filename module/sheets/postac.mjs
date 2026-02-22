import { staticID } from "../utils.mjs";

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

  async _onDrop(event) {
    event.preventDefault();
    const data = event.dataTransfer;
    const actor = this.actor;
    if (data) {
      const droppedItem = JSON.parse(data.getData("text/plain"));
      const droppedType = droppedItem.type;
      if (droppedType === "Item") {
        const itemData = await fromUuid(droppedItem.uuid);
        const type = itemData.type;
        switch (type) {
          case "talenty":
            const wydaneXp = itemData.system.kosztTalentu;
            actor.system.wydanieXP(wydaneXp, itemData);
            if (itemData.system.zwiekszneiePM) {
              actor.system.zwiekszMoc(itemData.system.dodatkowaMoc);
            }
            break;
        }
        await actor.createEmbeddedDocuments("Item", [itemData]);
      }
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

    // Remove old menu if exists
    document.querySelector(".custom-context-menu")?.remove();

    // Create element instead of raw string (safer and cleaner)
    const menu = document.createElement("div");
    menu.classList.add("custom-context-menu");
    menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Talent</div>
    <div class="menu-option" data-action="delete">Usuń Talent</div>
  `;

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
        const xp = item.system.kosztTalentu;
        await this.actor.system.zwrocPD(xp, item);
        if (item.system.zwiekszneiePM) {
          await this.actor.system.zmniejszneieMocy(item.system.dodatkowaMoc);
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
