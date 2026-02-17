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
      opis: new StringField({
        label: "wiedzmin.talent.opis",
        initial: "",
        required: true,
      }),
      powiazaneAtrybuty: new StringField({
        label: "wiedzmin.talent.powiazaneAtrybuty",
        initial: "",
        choices: {
          sila: "wiedzmin.atrubut.sila",
          zrecznosc: "wiedzmin.atrubut.zrecznosc",
          empatia: "wiedzmin.atrubut.empatia",
          rozum: "wiedzmin.atrubut.rozum",
        },
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
      zwiększoneObrazenia: new BooleanField({
        label: "wiedzmin.talent.zwiększoneObrazenia",
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
        initial: "",
        choices: {
          sila: "wiedzmin.atrubut.sila",
          zrecznosc: "wiedzmin.atrubut.zrecznosc",
          rozum: "wiedzmin.atrubut.rozum",
          empatia: "wiedzmin.atrubut.empatia",
        },
      }),
      atrybutPodmieniany: new StringField({
        label: "wiedzmin.talent.atrybutPodmieniany",
        initial: "",
        choices: {
          sila: "wiedzmin.atrubut.sila",
          zrecznosc: "wiedzmin.atrubut.zrecznosc",
          rozum: "wiedzmin.atrubut.rozum",
          empatia: "wiedzmin.atrubut.empatia",
        },
      }),
      czerpanieMocy: new BooleanField({
        label: "wiedzmin.talent.czerpanieMocy",
        initial: false,
      }),
      dodatkowaMoc: new NumberField({
        label: "wiedzmin.talent.dodatkowaMoc",
        initial: 0,
      }),
      zwiekszneiePM: new BooleanField({
        label: "wiedzmin.talent.zwiekszneiePM",
        initial: false,
      }),
      rzucanieZakleciaZeZwoju: new BooleanField({
        label: "wiedzmin.talent.rzucanieZakleciaZeZwoju",
        initial: false,
      }),
    };
  }
}
