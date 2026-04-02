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

export class bronDataModel extends foundry.abstract.TypeDataModel {
    static metadata = Object.freeze({});

    static defineSchema() {
        return {
            celnosc: new NumberField({
                initial :0,
                required:true,
                label:"wiedzmin.bron.celnosc"
            }),
            obrazenia: new NumberField ({
                initial :0,
                required:true,
                label:"wiedzmin.bron.obrazenia" 
            }),
            wartosc: new NumberField ({
                initial :0,
                required:true,
                label:"wiedzmin.bron.wartosc" 
            }),
            wymagaAmunicji: new BooleanField({
                initial: false,
                label: "wiedzmin.bron.wymagaAmunicji"
            }),
            zapasAmunicji: new NumberField({
                initial: 2,
                label: "wiedzmin.bron.zapasAmunicji"
            }),
        }
    }
}