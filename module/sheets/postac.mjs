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
    actions: {},
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
    return context;
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

    // Zawsze przelicz oba pola na podstawie aktualnego stanu DOM
    const inputsAdrenalina = Array.from(
      form.querySelectorAll("[name='system.adrenalina.value']"),
    );
    formData.object["system.adrenalina.value"] = this.getMax(inputsAdrenalina);

    const inputsZycie = Array.from(
      form.querySelectorAll("[name='system.zycie.value']"),
    );
    formData.object["system.zycie.value"] = this.getMax(inputsZycie);
    const inputsMoc = Array.from(
      form.querySelectorAll("[name='system.moc.value']"),
    );
    formData.object["system.moc.value"] = this.getMax(inputsMoc);
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
}
