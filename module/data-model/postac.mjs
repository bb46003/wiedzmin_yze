const {
  StringField,
  BooleanField,
  SchemaField,
  NumberField,
  HTMLField,
  SetField,
  ArrayField,
  DocumentUUIDField,
  IntegerSortField,
} = foundry.data.fields;

export class postacDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      atrybuty: new SchemaField({
        sila: new SchemaField({
          value: new NumberField({
            label: "wiedzmin.atrubut.sila",
            initial: 2,
            required: true,
          }),
          umiejetnosci: new SchemaField({
            krzepa: new NumberField({
              label: "wiedzmin.atrubut.krzepa",
              initial: 0,
            }),
            walka_wrecz: new NumberField({
              label: "wiedzmin.atrubut.walka_wrecz",
              initial: 0,
            }),
            wytrzymalosc: new NumberField({
              label: "wiedzmin.atrubut.wytrzymalosc",
              initial: 0,
            }),
          }),
        }),
        rozum: new SchemaField({
          value: new NumberField({
            label: "wiedzmin.atrubut.rozum",
            initial: 2,
            required: true,
          }),
          umiejetnosci: new SchemaField({
            spostrzegawczosc: new NumberField({
              label: "wiedzmin.atrubut.spostrzegawczosc",
              initial: 0,
            }),
            fach: new NumberField({
              label: "wiedzmin.atrubut.fach",
              initial: 0,
            }),
            wiedza: new NumberField({
              label: "wiedzmin.atrubut.wiedza",
              initial: 0,
            }),
          }),
        }),
        empatia: new SchemaField({
          value: new NumberField({
            label: "wiedzmin.atrubut.empatia",
            initial: 2,
            required: true,
          }),
          umiejetnosci: new SchemaField({
            wplyw: new NumberField({
              label: "wiedzmin.atrubut.wplyw",
              initial: 0,
            }),
            manipulacja: new NumberField({
              label: "wiedzmin.atrubut.manipulacja",
              initial: 0,
            }),
            wola: new NumberField({
              label: "wiedzmin.atrubut.wola",
              initial: 0,
            }),
          }),
        }),
        zrecznosc: new SchemaField({
          value: new NumberField({
            label: "wiedzmin.atrubut.zrecznosc",
            initial: 2,
            required: true,
          }),
          umiejetnosci: new SchemaField({
            zwinnosc: new NumberField({
              label: "wiedzmin.atrubut.zwinnosc",
              initial: 0,
            }),
            walka_dystansowa: new NumberField({
              label: "wiedzmin.atrubut.walka_dystansowa",
              initial: 0,
            }),
            zwinne_palce: new NumberField({
              label: "wiedzmin.atrubut.zwinne_palce",
              initial: 0,
            }),
          }),
        }),
      }),

      punkty_mocy: new SchemaField({
        value: new NumberField({ label: "wiedzmin.zycie", initial: undefined }),
        max: new NumberField({ label: "wiedzmin.zycie.max", initial: 5 }),
      }),
      zycie: new SchemaField({
        value: new NumberField({ label: "wiedzmin.zycie", initial: undefined }),
        max: new NumberField({ label: "wiedzmin.zycie.max", initial: 0 }),
      }),
      adrenalina: new SchemaField({
        value: new NumberField({ label: "wiedzmin.adrenalina", initial: 0 }),
        max: new NumberField({ label: "wiedzmin.adrenalina.max", initial: 9 }),
      }),
      cele_osobiste: new StringField({ initial: "" }),
      pd: new NumberField({ label: "wiedzmin.pd", initial: 0 }),
      punkty_fabuly: new NumberField({
        label: "wiedzmin.punktyFabuly",
        initial: 0,
        max: 3,
      }),
      ciezkie_rany: new StringField({
        label: "wiedzmin.ciezkie_rany",
        initial: "",
      }),
    };
  }

  static get schema() {
    const schema = super.schema;
    if (foundry.utils.isEmpty(schema))
      console.error(`Schema for ${this.name} is empty.`);
    return schema;
  }
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this._ustawZycie();
    this._prepareConditions();
  }
  _ustawZycie() {
    this.zycie.max = this.atrybuty.sila.value;
    if (this.zycie.max !== 0 && this.zycie.value === undefined) {
      this.zycie.value = this.zycie.max;
    }
  }
  /**
   * Apply conditions based on the {@link Actor.statuses} so that each condition is only applied once.
   *
   * @protected
   */
  _prepareConditions() {
    /** @type {Set<ConditionId>} */
    const statuses = this.parent.statuses;
    this.parent;

    /** @type {StatusEffectConfigMM3[]} */
    const conditions = [...statuses]
      .map((status) => wiedzmin_yze.config.CONDITIONS[status])
      .filter((condition) => condition);
    for (const condition of conditions) {
      // Remove actions from available ones when prevented by the condition
      if (condition.preventedActions) {
        for (const action of condition.preventedActions)
          this.actions?.delete(action);
      }
    }
  }

  async rzutAtrybut(atrybutKey) {
    const attribute = this.atrybuty[atrybutKey];
    if (!attribute) return;

    const attributeValue = Number(attribute.value) || 0;
    const atrubutLabel = game.i18n.localize(
      this.schema.fields.atrybuty.fields[atrybutKey].fields.value.label,
    );

    const adrenalinaValue = Number(this.adrenalina.value) || 0;
    await globalThis.wiedzmin_yze.WiedzminRoll.create({
      attribute: attributeValue,
      skill: 0,
      adrenalina: adrenalinaValue,
      atrubutLabel: atrubutLabel,
      umiejkaLabel: "",
      actorID: this.parent.id,
      umiejkaKey: "",
      atrybutKey: atrybutKey,
    });
  }
  async rzutUmiejka(umiejkaKey, atrybutKey) {
    const attribute = this.atrybuty[atrybutKey];
    if (!attribute) return;

    const attributeValue = Number(attribute.value) || 0;
    const atrubutLabel = game.i18n.localize(
      this.schema.fields.atrybuty.fields[atrybutKey].fields.value.label,
    );
    const skillValue = Number(attribute.umiejetnosci?.[umiejkaKey]) || 0;
    const umiejkaLabel = game.i18n.localize(
      this.schema.fields.atrybuty.fields[atrybutKey].fields.umiejetnosci.fields[
        umiejkaKey
      ].label,
    );
    const adrenalinaValue = Number(this.adrenalina.value) || 0;
    const roll = await globalThis.wiedzmin_yze.WiedzminRoll.create({
      attribute: attributeValue,
      skill: skillValue,
      adrenalina: adrenalinaValue,
      atrubutLabel: atrubutLabel,
      umiejkaLabel: umiejkaLabel,
      actorID: this.parent.id,
      umiejkaKey: umiejkaKey,
      atrybutKey: atrybutKey,
    });

    if (roll) await roll.toMessage();
  }
  async zwiekszAdrenaline() {
    this.adrenalina.value += 1;
    await this.parent.update({
      "system.adrenalina.value": this.adrenalina.value,
    });
  }
}
