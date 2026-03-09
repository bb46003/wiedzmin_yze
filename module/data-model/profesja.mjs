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

export class profesjaDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      atrybutWiodacy: new ArrayField(
        new StringField({
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
      ),
      ekwipunek: new HTMLField({
        label: "wiedzmin.talent.opis",
        initial: "",
        required: true,
      }),
      celeOsobiste: new ArrayField(
        new StringField({
          label: "wiedzin.profesja.celeOsobiste",
          initial: "",
        }),
      ),
      charakterystycznyPrzedmiot: new ArrayField(
        new StringField({
          label: "wiedzin.profesja.charakterystycznyPrzedmiot",
          initial: "",
        }),
      ),
      zamoznosc: new NumberField({
        label: "wiedzmin.profesja.zamoznosc",
        initial: 0,
      }),

      opis: new HTMLField({
        label: "wiedzmin.talent.opis",
        initial: "",
        required: true,
      }),
      umiejetnosciZawodowe: new ArrayField(
        new SchemaField({
          umiejka: new StringField({
            label: "wiedzmin.atrubut.specjalizacja",
            initial: "Brak",
            choices: toLabelObject(wiedzmin_yze.config.umiejki),
            required: true,
          }),
          umiejkaAlternatywna: new StringField({
            label: "wiedzmin.atrubut.specjalizacja",
            initial: "Brak",
            choices: toLabelObject(wiedzmin_yze.config.umiejki),
            required: true,
          }),
          bonus: new NumberField({
            label: "wiedzmin.tasa.bonusDoUmiejki",
            initial: 1,
          }),
          wybor: new BooleanField({
            label: "wiedzmin.profesja.wybor",
            initial: false,
          }),
        }),
      ),
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
      rasy: new ArrayField(
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

  async dodajAtrybut() {
    const atrybutWiodacy = this.atrybutWiodacy ?? [];

    // all possible choices
    const choices = {
      sila: game.i18n.localize("wiedzmin.atrubut.sila"),
      zrecznosc: game.i18n.localize("wiedzmin.atrubut.zrecznosc"),
      empatia: game.i18n.localize("wiedzmin.atrubut.empatia"),
      rozum: game.i18n.localize("wiedzmin.atrubut.rozum"),
    };

    // find keys not yet used
    const freeKeys = Object.keys(choices).filter(
      (key) => !atrybutWiodacy.includes(key),
    );

    // pick first available key, or empty string if none left
    const nowy = freeKeys[0] ?? "";

    // add it to the array
    atrybutWiodacy.push(nowy);

    await this.parent.update({ "system.atrybutWiodacy": atrybutWiodacy });
  }
  async usunAtrybut(id) {
    const atrybutWiodacy = this.atrybutWiodacy;
    atrybutWiodacy.splice(id, 1);
    await this.parent.update({ "system.atrybutWiodacy": atrybutWiodacy });
  }
  async dodajCel() {
    const celeOsobiste = this.celeOsobiste ?? [];
    const nowy = "";
    celeOsobiste.push(nowy);
    await this.parent.update({ "system.celeOsobiste": celeOsobiste });
  }
  async usunCel(id) {
    const celeOsobiste = this.celeOsobiste;
    celeOsobiste.splice(id, 1);
    await this.parent.update({ "system.celeOsobiste": celeOsobiste });
  }
  async dodajPrzedmiot() {
    const charakterystycznyPrzedmiot = this.charakterystycznyPrzedmiot ?? [];
    const nowy = "";
    charakterystycznyPrzedmiot.push(nowy);
    await this.parent.update({
      "system.charakterystycznyPrzedmiot": charakterystycznyPrzedmiot,
    });
  }
  async usunPrzedmiot(id) {
    const charakterystycznyPrzedmiot = this.charakterystycznyPrzedmiot;
    charakterystycznyPrzedmiot.splice(id, 1);
    await this.parent.update({
      "system.charakterystycznyPrzedmiot": charakterystycznyPrzedmiot,
    });
  }
  async dodajUmiejetnosc() {
    // Ensure umiejetnosciZawodowe is always an array
    const umiejetnosciZawodowe = this.umiejetnosciZawodowe ?? [];

    // Map existing values
    const existingUmiejka = umiejetnosciZawodowe.map((u) => u.umiejka);
    const existingUmiejkaAlt = umiejetnosciZawodowe.map(
      (u) => u.umiejkaAlternatywna,
    );

    // Build choices
    const wybory = toLabelObject(wiedzmin_yze.config.umiejki);

    // Filter keys that are not yet used in either field
    const freeKeys = Object.keys(wybory).filter(
      (key) =>
        !existingUmiejka.includes(key) && !existingUmiejkaAlt.includes(key),
    );

    // Prepare new entry
    const nowy = {
      umiejka: freeKeys[0] ?? "",
      umiejkaAlternatywna: "",
      bonus: 0,
      wybor: false,
    };

    // Add to the array
    umiejetnosciZawodowe.push(nowy);

    // Update the parent system
    await this.parent.update({
      "system.umiejetnosciZawodowe": umiejetnosciZawodowe,
    });
  }
  async usunUmiejetosc(id) {
    const umiejetnosciZawodowe = this.umiejetnosciZawodowe;
    umiejetnosciZawodowe.splice(id, 1);
    await this.parent.update({
      "system.umiejetnosciZawodowe": umiejetnosciZawodowe,
    });
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
  async _dodajRase(uuid, nane) {
    const rasy = this.rasy ?? [];
    const nowyRasa = {
      uuid: uuid,
      name: nane,
    };
    rasy.push(nowyRasa);
    this.parent.update({ "system.rasy": rasy });
  }
  async usunTalent(id) {
    const talenty = this.talenty;

    const index = talenty.findIndex((talent) => talent.uuid === id);
    if (index !== -1) {
      talenty.splice(index, 1);
    }
    await this.parent.update({ "system.talenty": talenty });
  }

  async usunRase(id) {
    const rasy = this.rasy;

    const index = rasy.findIndex((rasa) => rasa.uuid === id);
    if (index !== -1) {
      rasy.splice(index, 1);
    }
    await this.parent.update({ "system.rasy": rasy });
  }
}
