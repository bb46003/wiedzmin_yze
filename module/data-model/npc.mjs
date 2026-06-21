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

export class NPCDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      zycie: new SchemaField({
        value: new NumberField({ label: "Zdrowie Obecne", initial: undefined }),
        max: new NumberField({ label: "Zdrowie Maksymalne", initial: 0 }),
      }),
      inicjatywa: new NumberField({
        initial: 0,
        required: true,
        integer: true,
        label: "Inicjatywa",
      }),
      punkty_mocy: new SchemaField({
        value: new NumberField({ label: "Punkty Mocy", initial: undefined }),
        max: new NumberField({ label: "Maksymalne Punkty Mocy", initial: 0 }),
      }),
      potęga: new StringField({
        choices: {
          std: "Standardowa",
          elit: "Elitarna",
          leg: "Legendarna",
        },
        initial: "std",
        required: true,
      }),
      tabela_atakow: new StringField({
        initial: "",
        label: "Tabela Ataków Losowych",
      }),
      ataki: new ArrayField(
        new SchemaField({
          nazwa: new StringField({
            initial: "Nowy Atak",
            label: "Nazwa Ataku",
            required: true,
          }),
          atak: new NumberField({
            initial: 1,
            label: "Ilość Kości Ataku",
            min: 1,
          }),
          obrazenia: new NumberField({
            initial: 1,
            label: "Ilość Kości Obrażeń",
            min: 1,
          }),
        }),
      ),
      opis: new HTMLField({
        label: "Opis",
        initial: "",
        required: true,
      }),
      wielkosc: new StringField({
        choices: {
          maly: "Mały",
          sredni: "Średni",
          duzy: "Duży",
          wielki: "Wielki",
        },
        initial: "sredni",
        required: true,
        label: "Wielkość Potwora",
      }),
      zdolnosci: new ArrayField(
        new SchemaField({
          nazwa: new StringField({
            initial: "Zdolność",
          }),
          opis: new HTMLField({
            initial: "",
          }),
        }),
      ),
      obrona: new NumberField({
        initial: 0,
        label: "Obrona"
      })
    };
  }
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.prepareZdrowie();
    this.prepareWielkoscTokena();
  }

  prepareZdrowie() {
    const potega = this.potega;
    switch (potega) {
      case "elit":
        this.zdrowie += 3;
        break;
      case "leg":
        this.zdrowie += 5;
        break;
    }
  }
  prepareWielkoscTokena() {
    const token = this.parent.prototypeToken;
    let scale = 1;

    const wielkosc = this.wielkosc;
    switch (wielkosc) {
      case "maly":
        scale = 0.5;
        break;
      case "duzy":
        scale = 2;
        break;
      case "wielki":
        scale = 3;
        break;
    }
    token.update({ height: scale, width: scale });
  }
async dodajAZ(type) {
  const az = this[type] ?? [];
  let nowy = {};

  if (type === "zdolnosci") {
    nowy.nazwa = "Zdolność";
    nowy.opis = "";
  } else if (type === "ataki") {
    nowy.nazwa = "Atak";
    nowy.obrazenia = 1;
    nowy.atak = 1;
  }

  az.push(nowy);

  await this.parent.update({
    [`system.${type}`]: az
  });
}
}
