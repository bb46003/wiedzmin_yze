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
      czary: new ArrayField(
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
            initial: 0,
            label: "Ilość Kości Obrażeń",
            min: 0,
          }),
          id: new StringField({
            initial: "",
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
        label: "Obrona",
      }),
      poziomMocy: new StringField({
        initial: "brak",
        choices: {
          brak: "Brak",
          adept: "Adept",
          mistrz: "Mistrz",
          arcymistrz: "Arcymistrz",
        },
      }),
      szybkosc: new SchemaField({
        podstawa: new NumberField({
          required: true,
          nullable: false,
          integer: true,
          initial: 5,
          min: 0,
          label: "Szybkość",
        }),
      }),
    };
  }
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.prepareZdrowie();
    this.prepareWielkoscTokena();
    this._maxPunktyMocy();
    this._maxZycia();
  }
  _maxZycia() {
    if (this.zycie.value > this.zycie.max) {
      this.zycie.value = this.zycie.max;
    }
  }
  _maxPunktyMocy() {
    if (this.punkty_mocy.value > this.punkty_mocy.max) {
      this.punkty_mocy.value = this.punkty_mocy.max;
    }
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
  async dodajAZ(type, name, obrazenia, id) {
    const az = this[type] ?? [];
    let nowy = {};

    if (type === "zdolnosci") {
      nowy.nazwa = name ?? "Zdolność";
      nowy.opis = "";
    } else if (type === "ataki") {
      nowy.nazwa = name ?? "Atak";
      nowy.obrazenia = 1;
      nowy.atak = 1;
    } else if (type === "czary") {
      nowy.nazwa = name ?? "Czar";
      nowy.obrazenia = obrazenia ?? 1;
      nowy.atak = 1;
      nowy.id = id ?? "";
    }

    az.push(nowy);

    await this.parent.update({
      [`system.${type}`]: az,
    });
  }
  async usunAZ(type, id) {
    const stat = this[type];
    stat.splice(id, 1);
    await this.parent.update({ [`system.${type}`]: stat });
  }
  async NPCRzut(type, item, index) {
    const az = this[type] ?? [];
    const iloscKosci = az[index]?.atak;
    if (type === "czary") {
      const czar = item;
      const dostepnaMoc = this.punkty_mocy.value;
      const kosztBazowy = item.system.koszt.bazowy;
      if (kosztBazowy > dostepnaMoc) {
        ui.notifications.error(
          "Nie masz wystarczająco Punktów Mocy, by rzucić ten czar!",
        );
        return;
      }
      const roll = await globalThis.wiedzmin_yze.WiedzminRoll.rzucanieCzaru({
        attribute: iloscKosci,
        skill: 0,
        adrenalina: 0,
        atrubutLabel: " NPC Rzuca Czar",
        umiejkaLabel: "",
        actorID: this.parent.id,
        item: [],
        secondArtibute: 0,
        atrybutKey: "",
        umiejkaKey: "",
        czarID: item.id,
        dostepnaMoc: dostepnaMoc,
      });
    } else if (type === "ataki") {
      const weaponId = {
        name: az[index].nazwa,
        obrazenia: az[index].obrazenia,
      };
      const roll = await globalThis.wiedzmin_yze.WiedzminRoll.atakBronia({
        attribute: iloscKosci,
        skill: 0,
        adrenalina: 0,
        atrubutLabel: " NPC Atakuje",
        umiejkaLabel: "",
        actorID: this.parent.id,
        item: [],
        secondArtibute: "",
        atrybutKey: "",
        umiejkaKey: "",
        weaponId: weaponId,

        // 👇 NEW DATA
        attributesList: [
          { key: "", value: iloscKosci, label: az[index].nazwa },
        ],
        skillsList: [{ key: "Brak", value: 0, parent: "", label: "Brak" }],
      });

      if (roll) await roll.toMessage();
    } else {
      const obrona = this.obrona;
      await globalThis.wiedzmin_yze.WiedzminRoll.create({
        attribute: obrona,
        skill: null,
        adrenalina: 0,
        atrubutLabel: "Obrona",
        umiejkaLabel: "",
        actorID: this.parent.id,
        umiejkaKey: "",
        atrybutKey: "",
        item: [],
        secondArtibute: "",
      });
    }
  }
  async wydawaniePM(kosztBazowy, dodatkowaMoc) {
    const obecnaMoc = this.punkty_mocy.value;
    let nowaMoc = obecnaMoc - kosztBazowy - dodatkowaMoc;

    if (nowaMoc <= 0) {
      nowaMoc = 0;
    }

    await this.parent.update({ "system.punkty_mocy.value": nowaMoc });
  }
  async obrazeniaZCzaru(obrazenia) {
    const obecneZdrowie = this.zycie.value;
    let noweZdrowie = obecneZdrowie - obrazenia;
    if (noweZdrowie < 0) {
      noweZdrowie = 0;
    }
    await this.parent.update({ "system.zycie.value": noweZdrowie });
  }
}
