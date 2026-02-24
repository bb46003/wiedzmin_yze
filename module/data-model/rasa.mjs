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

export class rasaDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      bonusyAtrybuty: new ArrayField(
        new SchemaField({
          bonus: new NumberField({
            label: "wiedzmin.rasa.bonusDoAtrybutu",
            initial: 0,
          }),
          atrybut: new StringField({
            label: "wiedzmin.talent.powiazaneAtrybuty",
            initial: "sila",
            choices: {
              sila: game.i18n.localize("wiedzmin.atrubut.sila"),
              zrecznosc: game.i18n.localize("wiedzmin.atrubut.zrecznosc"),
              empatia: game.i18n.localize("wiedzmin.atrubut.empatia"),
              rozum: game.i18n.localize("wiedzmin.atrubut.rozum"),
            },
            required: true,
          }),
        }),
      ),
      zapewniaBonusDoUmiejki: new BooleanField({
        label: "wiedzmin.rasa.bonusDoUmiejki",
        initial: false,
      }),
      bonusyUmiejki: new ArrayField(
        new SchemaField({
          umiejka: new StringField({
            label: "wiedzmin.atrubut.specjalizacja",
            initial: "Brak",
            choices: toLabelObject(wiedzmin_yze.config.umiejki),
            required: true,
          }),
          bonus: new NumberField({
            label: "wiedzmin.tasa.bonusDoUmiejki",
            initial: 0,
          }),
        }),
      ),
      opis: new HTMLField({
        label: "wiedzmin.talent.opis",
        initial: "",
        required: true,
      }),

      talenty: new ArrayField(
        new SchemaField({
          uuid: new StringField({
            initial: "",
          }),
          name: new StringField({
            initial: "",
          }),
        }),
      ),
    };
  }

  async _dodajTalent(uuid, nane) {
    const talenty = this.talenty ?? [];
    const nowyTalent = {
      uuid: uuid,
      name: nane,
    };
    talenty.push(nowyTalent);
    this.parent.update({ "system.talenty": talenty });
  }
  async dodajAtrybut() {
    const bonusyAtrybut = this.bonusyAtrybuty ?? [];
    const nowyAtr = {
      atrybut: "sila",
      bonus: 0,
    };
    bonusyAtrybut.push(nowyAtr);
    await this.parent.update({ "system.bonusyAtrybuty": bonusyAtrybut });
  }
  async usunAtrybut(id) {
    const bonusyAtrybut = this.bonusyAtrybuty;
    bonusyAtrybut.splice(id, 1);
    await this.parent.update({ "system.bonusyAtrybuty": bonusyAtrybut });
  }

  async dodajUmiejki() {
    const bonusyUmiejki = this.bonusyUmiejki ?? [];
    const nowyUm = {
      umiejka: "Brak",
      bonus: 0,
    };
    bonusyUmiejki.push(nowyUm);
    await this.parent.update({ "system.bonusyUmiejki": bonusyUmiejki });
  }
  async usunUmiejki(id) {
    const bonusyUmiejki = this.bonusyUmiejki;
    bonusyUmiejki.splice(id, 1);
    await this.parent.update({ "system.bonusyAtrybuty": bonusyUmiejki });
  }
}
