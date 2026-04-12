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

export class czarDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      // 📌 META
      poziom: new StringField({
        initial: "adept",
        choices: {
          adept: "Adept",
          mistrz: "Mistrz",
          arcymistrz: "Arcymistrz",
        },
        required: true,
        label: "wiedzmin.czar.poziom",
      }),

      typ: new StringField({
        initial: "atak",
        choices: {
          atak: "Atak",
          kontrola: "Kontrola",
          buff: "Wzmocnienie",
          utility: "Uzytkowe",
        },
        required: true,
        label: "wiedzmin.czar.typ",
      }),

      // 💧 KOSZT
      koszt: new SchemaField({
        bazowy: new NumberField({
          initial: 0,
          required: true,
        }),
        podtrzymanie: new NumberField({
          initial: 0,
          required: true,
        }),
      }),

      // ⏳ CZAS TRWANIA
      czas_trwania: new SchemaField({
        typ: new StringField({
          initial: "natychmiast",
          choices: {
            natychmiast: "Natychmiast",
            tury: "Tury",
            minuty: "Minuty",
            godziny: "Godziny",
            podtrzymywany: "Podtrzymywany",
            permanentny: "Permanentny",
          },
          required: true,
        }),
        wartosc: new NumberField({
          initial: 0,
          required: true,
        }),
      }),

      // 📏 ZASIEG
      zasieg: new SchemaField({
        typ: new StringField({
          initial: "dystans",
          choices: {
            wlasny: "Wlasny",
            dotyk: "Dotyk",
            dystans: "Dystans",
          },
          required: true,
        }),
        wartosc: new NumberField({
          initial: 0,
          required: true,
        }),
      }),

      // 🎯 CEL
      cel: new SchemaField({
        typ: new StringField({
          initial: "pojedynczy",
          choices: {
            pojedynczy: "Pojedynczy",
            obszar: "Obszar",
            linia: "Linia",
            stozek: "Stozek",
          },
          required: true,
        }),
        wartosc: new NumberField({
          initial: 0,
          required: false,
        }),
      }),

      // 🛡️ OBRONA
      obrona: new SchemaField({
        typ: new StringField({
          initial: "brak",
          choices: {
            brak: "Brak",
            unik: "Unik",
            wola: "Wola",
            kondycja: "Kondycja",
            inny: "Inny",
          },
          required: true,
        }),
        modyfikator: new NumberField({
          initial: 0,
          required: true,
        }),
        inny: new StringField({ initial: "" }),
      }),
      obrazenia: new SchemaField({
        zadajeObrazenia: new BooleanField({
          initial :false
        }),
        podstawowe: new NumberField({
          initial: 1,
        }),
        zaDodatkoweSuksecy: new NumberField({
          initial: 1
        })
      }),

      // 📝 OPIS
      opis: new HTMLField({
        label: "wiedzmin.czar.opis",
        initial: "",
        required: true,
      }),
    };
  }
}
