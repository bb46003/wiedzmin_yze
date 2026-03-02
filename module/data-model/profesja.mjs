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
      wymaganaRasa: new ArrayField(
        new StringField({
          label: "wiedzin.profesja.wymaganaRasa",
          initial: "",
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
      zamorznosc: new NumberField({
        label: "wiedzmin.profesja.zamorznosc",
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
            initial: false
          })
        }),
      )
    };
  }

 async dodajAtrybut(){
    const atrybutWiodacy = this.atrybutWiodacy ?? [];
    const nowy = "";
    atrybutWiodacy.push(nowy);
    await this.parent.update({ "system.atrybutWiodacy": atrybutWiodacy });
  }
  async usunAtrybut(id){
    const atrybutWiodacy = this.atrybutWiodacy;
    atrybutWiodacy.splice(id, 1);
    await this.parent.update({ "system.atrybutWiodacy": atrybutWiodacy });
  }
  async dodajCel(){
    const celeOsobiste = this.celeOsobiste ?? [];
    const nowy = "";
    celeOsobiste.push(nowy);
    await this.parent.update({ "system.celeOsobiste": celeOsobiste });
  }
  async usunCel(id){
    const celeOsobiste = this.celeOsobiste;
    celeOsobiste.splice(id, 1);
    await this.parent.update({ "system.celeOsobiste": celeOsobiste });
  }
  async dodajPrzedmiot(){
    const charakterystycznyPrzedmiot = this.charakterystycznyPrzedmiot ?? [];
    const nowy = {
      umiejka: "Brak",
      bonus: 0,
      wybor: false
    };
    charakterystycznyPrzedmiot.push(nowy);
    await this.parent.update({ "system.charakterystycznyPrzedmiot": charakterystycznyPrzedmiot });
  }
  async usunPrzedmiot(id){
    const charakterystycznyPrzedmiot = this.charakterystycznyPrzedmiot;
    charakterystycznyPrzedmiot.splice(id, 1);
    await this.parent.update({ "system.charakterystycznyPrzedmiot": charakterystycznyPrzedmiot });
  }
  async dodajUmiejetnosc(){
    const umiejetnosciZawodowe = this.umiejetnosciZawodowe ?? [];
    const nowy = "";
    umiejetnosciZawodowe.push(nowy);
    await this.parent.update({ "system.bonusyUmiejki": umiejetnosciZawodowe });
  }
  async usunUmiejetosc(id){
    const umiejetnosciZawodowe = this.umiejetnosciZawodowe;
    umiejetnosciZawodowe.splice(id, 1);
    await this.parent.update({ "system.umiejetnosciZawodowe": umiejetnosciZawodowe });
  }
  async usunRase(id){

  }
}
