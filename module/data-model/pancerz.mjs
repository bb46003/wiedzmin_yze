import { toLabelObject } from "../utils.mjs";
import { WiedzminRoll } from "../roll/wiedzmin-roll.mjs";

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

export class pancerzDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      efekt: new StringField({
        initial: "brak",
        choices: {
          brak: "-",
          sprawnosc_inicjatywa: "Sprwaność i inicjatywa",
          parowanie: "Parowanie",
          ciezka_rana: "Uławienie przy Cięzkiej Ranie",
        },

        required: true,
        label: "wiedzmin.bron.celnosc",
      }),
      wartosc_efektu: new NumberField({
        initial: 0,
        required: true,
      }),
      wyparowanie: new NumberField({
        initial: 0,
        required: true,
        label: "wiedzmin.bron.wyparowanie",
      }),
      wartosc: new NumberField({
        initial: 0,
        required: true,
        label: "wiedzmin.bron.wartosc",
      }),
      opis: new HTMLField({
        label: "wiedzmin.bron.opis",
        initial: "",
        required: true,
      }),
    };
  }
}
