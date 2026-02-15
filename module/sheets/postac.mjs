import { staticID } from "../utils.mjs";

const { api, sheets } = foundry.applications;

export class postac extends api.HandlebarsApplicationMixin(
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
      toggleCondition: postac._onToggleCondition,
      rzut_atrybut: postac.#rzut_atrybut,
      rzut_umiejka: postac.#rzut_umiejka,
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
      ...wiedzmin_yze.config.STATUS_EFFECTS,
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
}
