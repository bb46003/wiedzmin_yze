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

export class talentyDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      poziom: new NumberField({
        label: "wiedzmin.talent.poziom",
        initial: 1,
        choices: { 1: "I", 2: "II", 3: "III" },
        required: true,
      }),
      opis: new HTMLField({
        label: "wiedzmin.talent.opis",
        initial: "",
        required: true,
      }),
      powiazaneAtrybuty: new StringField({
        label: "wiedzmin.talent.powiazaneAtrybuty",
        initial: "sila",
        choices: {
          sila: game.i18n.localize("wiedzmin.atrubut.sila"),
          zrecznosc: game.i18n.localize("wiedzmin.atrubut.zrecznosc"),
          empatia: game.i18n.localize("wiedzmin.atrubut.empatia"),
          rozum: game.i18n.localize("wiedzmin.atrubut.rozum"),
        },
        allowBlank: true,
      }),
      bonu: new NumberField({
        label: "wiedzmin.talent.bonu",
        initial: 0,
      }),
      dodatkoweForsowanie: new BooleanField({
        label: "wiedzmin.talent.dodatkoweForsowanie",
        initial: false,
      }),
      kosztTalentu: new NumberField({
        label: "wiedzmin.talent.kosztTalentu",
        initial: 10,
      }),
      zwiekszoneObrazenia: new BooleanField({
        label: "wiedzmin.talent.zwiekszoneObrazenia",
        initial: false,
      }),
      bonusDoObrazen: new NumberField({
        label: "wiedzmin.talent.bonusDoObrazen",
        initial: 0,
      }),
      podmianaAtrybutu: new BooleanField({
        label: "wiedzmin.talent.podmianaAtrybutu",
        initial: false,
      }),
      atrybutDoPodmiany: new StringField({
        label: "wiedzmin.talent.atrybutDoPodmiany",
        initial: "sila",
        choices: {
          sila: game.i18n.localize("wiedzmin.atrubut.sila"),
          zrecznosc: game.i18n.localize("wiedzmin.atrubut.zrecznosc"),
          rozum: game.i18n.localize("wiedzmin.atrubut.rozum"),
          empatia: game.i18n.localize("wiedzmin.atrubut.empatia"),
        },
      }),
      atrybutPodmieniany: new StringField({
        label: "wiedzmin.talent.atrybutPodmieniany",
        initial: "sila",
        choices: {
          sila: game.i18n.localize("wiedzmin.atrubut.sila"),
          zrecznosc: game.i18n.localize("wiedzmin.atrubut.zrecznosc"),
          rozum: game.i18n.localize("wiedzmin.atrubut.rozum"),
          empatia: game.i18n.localize("wiedzmin.atrubut.empatia"),
        },
      }),
      czerpanieMocy: new BooleanField({
        label: "wiedzmin.talent.czerpanieMocy",
        initial: false,
      }),
      bonusCzerpaniaMocy: new NumberField({
        label: "wiedzmin.talent.bonusCzerpaniaMocy",
        initial: 0,
      }),
      dodatkowaMoc: new NumberField({
        label: "wiedzmin.talent.dodatkowaMoc",
        initial: 5,
      }),
      zwiekszneiePM: new BooleanField({
        label: "wiedzmin.talent.zwiekszneiePM",
        initial: false,
      }),
      rzucanieZakleciaZeZwoju: new BooleanField({
        label: "wiedzmin.talent.rzucanieZakleciaZeZwoju",
        initial: false,
      }),
      rzucany: new BooleanField({
        label: "wiedzmin.talent.rzucany",
        initial: false,
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
  }
}
