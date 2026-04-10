import { toLabelObject } from "../utils.mjs";

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
          max: new NumberField({
            label: "wiedzmin.atrubut.sila",
            initial: 4,
            required: true,
          }),
          umiejetnosci: new SchemaField({
            krzepa: new NumberField({
              label: "wiedzmin.atrubut.krzepa",
              initial: 0,
              max: 5,
            }),
            walka_wrecz: new NumberField({
              label: "wiedzmin.atrubut.walka_wrecz",
              initial: 0,
              max: 5,
            }),
            wytrzymalosc: new NumberField({
              label: "wiedzmin.atrubut.wytrzymalosc",
              initial: 0,
              max: 5,
            }),
          }),
        }),
        rozum: new SchemaField({
          value: new NumberField({
            label: "wiedzmin.atrubut.rozum",
            initial: 2,
            required: true,
          }),
          max: new NumberField({
            label: "wiedzmin.atrubut.sila",
            initial: 4,
            required: true,
          }),
          umiejetnosci: new SchemaField({
            spostrzegawczosc: new NumberField({
              label: "wiedzmin.atrubut.spostrzegawczosc",
              initial: 0,
              max: 5,
            }),
            fach: new NumberField({
              label: "wiedzmin.atrubut.fach",
              initial: 0,
              max: 5,
            }),
            wiedza: new NumberField({
              label: "wiedzmin.atrubut.wiedza",
              initial: 0,
              max: 5,
            }),
          }),
        }),
        empatia: new SchemaField({
          value: new NumberField({
            label: "wiedzmin.atrubut.empatia",
            initial: 2,
            required: true,
          }),
          max: new NumberField({
            label: "wiedzmin.atrubut.sila",
            initial: 4,
            required: true,
          }),
          umiejetnosci: new SchemaField({
            wplyw: new NumberField({
              label: "wiedzmin.atrubut.wplyw",
              initial: 0,
              max: 5,
            }),
            manipulacja: new NumberField({
              label: "wiedzmin.atrubut.manipulacja",
              initial: 0,
              max: 5,
            }),
            wola: new NumberField({
              label: "wiedzmin.atrubut.wola",
              initial: 0,
              max: 5,
            }),
          }),
        }),
        zrecznosc: new SchemaField({
          value: new NumberField({
            label: "wiedzmin.atrubut.zrecznosc",
            initial: 2,
            required: true,
          }),
          max: new NumberField({
            label: "wiedzmin.atrubut.sila",
            initial: 4,
            required: true,
          }),
          umiejetnosci: new SchemaField({
            zwinnosc: new NumberField({
              label: "wiedzmin.atrubut.zwinnosc",
              initial: 0,
              max: 5,
            }),
            walka_dystansowa: new NumberField({
              label: "wiedzmin.atrubut.walka_dystansowa",
              initial: 0,
              max: 5,
            }),
            zwinne_palce: new NumberField({
              label: "wiedzmin.atrubut.zwinne_palce",
              initial: 0,
              max: 5,
            }),
          }),
        }),
      }),
      specjalizacjaFach: new StringField({
        label: "wiedzmin.atrubut.specjalizacja",
        initial: "Brak",
        choices: toLabelObject(wiedzmin_yze.config.fachy),
        required: true,
      }),
      punkty_mocy: new SchemaField({
        value: new NumberField({ label: "wiedzmin.zycie", initial: undefined }),
        max: new NumberField({ label: "wiedzmin.zycie.max", initial: 0 }),
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
      charakterystyczny_przedmiot: new StringField({ initial: "" }),
      uzyto_przedmiotu: new BooleanField({ initial: false }),
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
      zamoznosc: new NumberField({
        label: "wiedzmin.profesja.zamoznosc",
        initial: 0,
      }),
      ekwipunek: new HTMLField({
        label: "wiedzmin.talent.opis",
        initial: "",
        required: true,
      }),
      szybkosc: new SchemaField({
        podstawa: new NumberField({
          required: true,
          nullable: false,
          integer: true,
          initial: 5,
          min: 0,
        }),
      }),
      inicjatywa: new NumberField({
        initial: 0,
        required: true,
        integer: true,
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
    this._prepareMoc();
    this._maxZycia();
    this._inicjatywa();
  }
  _inicjatywa() {
    const pancerz = this.parent.items.filter(
      (i) => i.type === "pancerz" && i.system.efekt === "sprawnosc_inicjatywa",
    );
    if (pancerz.length > 0) {
      this.inicjatywa = pancerz[0].system.wartosc_efektu;
    }
  }
  _maxZycia() {
    if (this.zycie.value > this.zycie.max) {
      this.zycie.value = this.zycie.max;
    }
  }
  _ustawZycie() {
    this.zycie.max = this.atrybuty.sila.value;
    if (this.zycie.max !== 0 && this.zycie.value === undefined) {
      this.zycie.value = this.zycie.max;
    }
  }

  _prepareMoc() {
    const talentMoc = this.parent.items.find(
      (i) => i.type === "talenty" && i.system.zwiekszneiePM,
    );
    if (talentMoc) {
      this.punkty_mocy.max = talentMoc.system.dodatkowaMoc;
    } else {
      this.punkty_mocy.max = 0;
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

  async rzutAtrybut(atrybutKey, item = []) {
    const attribute = this.atrybuty[atrybutKey];
    if (!attribute) return;

    const attributeValue = Number(attribute.value) || 0;
    const atrubutLabel = game.i18n.localize(
      this.schema.fields.atrybuty.fields[atrybutKey].fields.value.label,
    );
    const { powiazaneTalenty: inneTalenty, powiazaneAtrybuty: secondArtibute } =
      await this.sprawdzTalenty(atrybutKey, item);

    const adrenalinaValue = Number(this.adrenalina.value) || 0;
    await globalThis.wiedzmin_yze.WiedzminRoll.create({
      attribute: attributeValue,
      skill: null,
      adrenalina: adrenalinaValue,
      atrubutLabel: atrubutLabel,
      umiejkaLabel: "",
      actorID: this.parent.id,
      umiejkaKey: "",
      atrybutKey: atrybutKey,
      item: inneTalenty,
      secondArtibute: secondArtibute,
    });
  }

  async rzutUmiejka(umiejkaKey, atrybutKey, item = []) {
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
    const { powiazaneTalenty: inneTalenty, powiazaneAtrybuty: secondArtibute } =
      await this.sprawdzTalenty(atrybutKey, item);
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
      item: inneTalenty,
      secondArtibute: secondArtibute,
    });

    if (roll) await roll.toMessage();
  }

  async zwiekszAdrenaline() {
    this.adrenalina.value += 1;
    await this.parent.update({
      "system.adrenalina.value": this.adrenalina.value,
    });
  }

  async sprawdzTalenty(atrybutKey, extraItems = [], atak = false) {
    const items = this.parent.items.filter((i) => i.type === "talenty");

    const allItems = items.concat(extraItems);

    const powiazaneTalenty = [];
    const powiazaneAtrybuty = [];

    allItems.forEach((item) => {
      if (
        item.system.powiazaneAtrybuty === atrybutKey &&
        (item.system.zapewniaBonus || item.system.rzucany)
      ) {
        powiazaneTalenty.push(item);
      }

      if (
        item.system.atrybutDoPodmiany === atrybutKey &&
        item.system.podmianaAtrybutu
      ) {
        powiazaneTalenty.push(item);

        const attribute = this.atrybuty[atrybutKey];
        const attribute2 = this.atrybuty[item.system.atrybutPodmieniany];

        const atrubutLabel = game.i18n.localize(
          this.schema.fields.atrybuty.fields[atrybutKey].fields.value.label,
        );
        const atrubutLabel2 = game.i18n.localize(
          this.schema.fields.atrybuty.fields[item.system.atrybutPodmieniany]
            .fields.value.label,
        );
        powiazaneAtrybuty.push(
          {
            value: attribute.value,
            label: atrubutLabel,
            key: atrybutKey,
          },
          {
            value: attribute2.value,
            label: atrubutLabel2,
            key: item.system.atrybutPodmieniany,
          },
        );
      }
      if (atak) {
        if (item.system.zwiekszoneObrazenia) {
          powiazaneTalenty.push(item);
        }
      }
    });

    return { powiazaneTalenty, powiazaneAtrybuty };
  }

  async wydanieXP(wydaneXp, item) {
    this.parent.update({ "system.pd": this.pd - wydaneXp });
    const itemName = item.name;
    ChatMessage.create({
      user: game.user.id,
      speaker: this,
      content: `Postać ${this.parent.name} dodała Talent ${itemName} i wydała ${wydaneXp}PD`,
    });
  }

  async zwrocPD(xp, item) {
    this.parent.update({ "system.pd": this.pd + xp });
    const itemName = item.name;
    ChatMessage.create({
      user: game.user.id,
      speaker: this,
      content: `Postać ${this.parent.name} usuną Talent ${itemName} i przywrócono ${xp}PD`,
    });
  }

  async zwiekszMoc(dodatkowaMoc) {
    await this.parent.update({
      "system.punkty_mocy.max": this.punkty_mocy.max + dodatkowaMoc,
    });
  }

  async zmniejszneieMocy(dodatkowaMoc) {
    const nowaMaxMoc = Math.max(0, this.punkty_mocy.max - dodatkowaMoc);
    const updateData = { "system.punkty_mocy.max": nowaMaxMoc };
    if (this.punkty_mocy.value > nowaMaxMoc) {
      updateData["system.punkty_mocy.value"] = nowaMaxMoc;
    }
    await this.parent.update(updateData);
  }

  async _bonusZRasy(podbiceAtrybutu) {
    const updateData = {};
    const updateData2 = {};
    podbiceAtrybutu.forEach((podbicie) => {
      this.atrybuty[podbicie.atrybut].max + Number(podbicie.bonus);
      const atrybut =
        this.atrybuty[podbicie.atrybut].value + Number(podbicie.bonus);
      updateData[`system.atrybuty.${podbicie.atrybut}.max`] = updateData2[
        `system.atrybuty.${podbicie.atrybut}.value`
      ] = atrybut;
    });
    await this.parent.update(updateData);
    await this.parent.update(updateData2);
  }

  async _bonusZRasyUmiejka(podbicieUmiejki) {
    const updateData = {};
    podbicieUmiejki.forEach((podbicieUmiejki) => {
      const fach = wiedzmin_yze.config.umiejki[podbicieUmiejki.umiejka];
      const umiejka =
        this.atrybuty[fach.atrybKey].umiejetnosci[podbicieUmiejki.umiejka] +
        podbicieUmiejki.bonus;
      updateData[
        `system.atrybuty.${fach.atrybKey}.umiejetnosci.${podbicieUmiejki.umiejka}`
      ] = umiejka;
    });
    await this.parent.update(updateData);
  }

  async _bonusZRasyUsun(podbiceAtrybutu) {
    const updateData = {};
    podbiceAtrybutu.forEach((podbicie) => {
      const atrybut =
        this.atrybuty[podbicie.atrybut].value - Number(podbicie.bonus);
      updateData[`system.atrybuty.${podbicie.atrybut}.max`] =
        this.atrybuty[podbicie.atrybut].max - Number(podbicie.bonus);
      updateData[`system.atrybuty.${podbicie.atrybut}.value`] = atrybut;
    });
    await this.parent.update(updateData);
  }

  async _bonusZRasyUmiejkaUsun(podbicieUmiejki) {
    const updateData = {};
    podbicieUmiejki.forEach((podbicieUmiejki) => {
      const fach = wiedzmin_yze.config.umiejki[podbicieUmiejki.umiejka];
      const umiejka =
        this.atrybuty[fach.atrybKey].umiejetnosci[podbicieUmiejki.umiejka] -
        podbicieUmiejki.bonus;
      updateData[
        `system.atrybuty.${fach.atrybKey}.umiejetnosci.${podbicieUmiejki.umiejka}`
      ] = umiejka;
    });
    await this.parent.update(updateData);
  }

  async atrybutWiodacy(atrybutWiodacy) {
    const updateData = {};
    updateData[`system.atrybuty.${atrybutWiodacy}.max`] =
      this.atrybuty[atrybutWiodacy].max + 1;
    await this.parent.update(updateData);
  }

  async _usunAtrWiodacy(atrybutWiodacy) {
    const updateData = {};
    updateData[`system.atrybuty.${atrybutWiodacy}.max`] =
      this.atrybuty[atrybutWiodacy].max - 1;
    await this.parent.update(updateData);
  }

  async _przywrucAtr(ograniczone) {
    const updateData = {};

    ograniczone.forEach((atr) => {
      updateData[`system.atrybuty.${atr.atrybut}.max`] = 4;
    });
    await this.parent.update(updateData);
  }

  async _ograniczaAtr(ograniczone) {
    const updateData = {};

    ograniczone.forEach((atr) => {
      updateData[`system.atrybuty.${atr.atrybut}.max`] = atr.wartoscMax;
    });
    await this.parent.update(updateData);
  }

  async pobierzMoc(bonusDoCzerpania, talenty) {
    const atrybut = this.atrybuty.rozum.value;
    const umiejka = this.atrybuty.rozum.umiejetnosci.fach;

    const atrubutLabel = game.i18n.localize(
      this.schema.fields.atrybuty.fields.rozum.fields.value.label,
    );
    const umiejkaLabel = game.i18n.localize(
      this.schema.fields.atrybuty.fields["rozum"].fields.umiejetnosci.fields[
        "fach"
      ].label,
    );
    const adrenalinaValue = Number(this.adrenalina.value) || 0;
    const { powiazaneTalenty: inneTalenty, powiazaneAtrybuty: secondArtibute } =
      await this.sprawdzTalenty("rozum", talenty);
    const roll = await globalThis.wiedzmin_yze.WiedzminRoll.czerpanieMocy({
      attribute: atrybut,
      skill: umiejka,
      adrenalina: adrenalinaValue,
      atrubutLabel: atrubutLabel,
      umiejkaLabel: umiejkaLabel,
      actorID: this.parent.id,
      bonusDoCzerpania: bonusDoCzerpania,
      item: inneTalenty,
      secondArtibute: secondArtibute,
      atrybutKey: "rozum",
      umiejkaKey: "fach",
    });

    if (roll) await roll.toMessage();
  }

  async atakBronia(bron, atrybutKey, umiejkaKey) {
    const attribute = this.atrybuty[atrybutKey];
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

    // ✅ ALL ATTRIBUTES
    const attributesList = Object.entries(this.atrybuty).map(([key, attr]) => {
      const label = game.i18n.localize(
        this.schema.fields.atrybuty.fields[key].fields.value.label,
      );

      return {
        key,
        value: Number(attr.value) || 0,
        label,
      };
    });

    // ✅ ALL SKILLS (flattened)
    const skillsList = Object.entries(this.atrybuty).flatMap(
      ([attrKey, attr]) => {
        if (!attr.umiejetnosci) return [];

        return Object.entries(attr.umiejetnosci).map(
          ([skillKey, skillValue]) => {
            const label = game.i18n.localize(
              this.schema.fields.atrybuty.fields[attrKey].fields.umiejetnosci
                .fields[skillKey].label,
            );

            return {
              key: skillKey,
              value: Number(skillValue) || 0,
              parent: attrKey,
              label,
            };
          },
        );
      },
    );

    const { powiazaneTalenty: inneTalenty, powiazaneAtrybuty: secondArtibute } =
      await this.sprawdzTalenty(atrybutKey, [], true);

    const roll = await globalThis.wiedzmin_yze.WiedzminRoll.atakBronia({
      attribute: attributeValue,
      skill: skillValue,
      adrenalina: adrenalinaValue,
      atrubutLabel: atrubutLabel,
      umiejkaLabel: umiejkaLabel,
      actorID: this.parent.id,
      item: inneTalenty,
      secondArtibute: secondArtibute,
      atrybutKey: atrybutKey,
      umiejkaKey: umiejkaKey,
      weaponId: bron,

      // 👇 NEW DATA
      attributesList,
      skillsList,
    });

    if (roll) await roll.toMessage();
  }

  async rzucanieCzaru(czarID, atrybut, umiejka){
    const { powiazaneTalenty: inneTalenty, powiazaneAtrybuty: secondArtibute } =
      await this.sprawdzTalenty(atrybut, [], true);

        const attribute = this.atrybuty[atrybut];
    const attributeValue = Number(attribute.value) || 0;

    const atrubutLabel = game.i18n.localize(
      this.schema.fields.atrybuty.fields[atrybut].fields.value.label,
    );

    const skillValue = Number(attribute.umiejetnosci?.[umiejka]) || 0;

    const umiejkaLabel = game.i18n.localize(
      this.schema.fields.atrybuty.fields[atrybut].fields.umiejetnosci.fields[
        umiejka
      ].label,
    );
    const dostepnaMoc = this.punkty_mocy.value;
    const adrenalinaValue = Number(this.adrenalina.value) || 0;
        const roll = await globalThis.wiedzmin_yze.WiedzminRoll.rzucanieCzaru({
      attribute: attributeValue,
      skill: skillValue,
      adrenalina: adrenalinaValue,
      atrubutLabel: atrubutLabel,
      umiejkaLabel: umiejkaLabel,
      actorID: this.parent.id,
      item: inneTalenty,
      secondArtibute: secondArtibute,
      atrybutKey: atrybut,
      umiejkaKey: umiejka,
      czarID: czarID,
      dostepnaMoc: dostepnaMoc

    });

    if (roll) await roll.toMessage();
  }
}
