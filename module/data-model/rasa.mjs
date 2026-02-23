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
      bonusDoAtrybutu: new NumberField({
        label: "wiedzmin.rasa.bonusDoAtrybutu",
        initial: 0,
      }),
      zapewniaBonusDoUmiejki: new BooleanField({
        label: "wiedzmin.rasa.bonusDoUmiejki",
        initial: false,
      }),
      wybranaUmiejka: new StringField({
        label: "wiedzmin.atrubut.specjalizacja",
        initial: "Brak",
        choices: toLabelObject(wiedzmin_yze.config.umiejki),
        required: true,
      }),
      bonusDoUmiejki: new NumberField({
        label: "wiedzmin.tasa.bonusDoUmiejki",
        initial: 0,
      }),
      opis: new HTMLField({
        label: "wiedzmin.talent.opis",
        initial: "",
        required: true,
      }),
      powiazanyAtrybuty: new StringField({
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
}
