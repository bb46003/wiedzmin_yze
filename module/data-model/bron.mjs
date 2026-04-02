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

export class bronDataModel extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});

  static defineSchema() {
    return {
      celnosc: new NumberField({
        initial: 0,
        required: true,
        label: "wiedzmin.bron.celnosc",
      }),
      obrazenia: new NumberField({
        initial: 0,
        required: true,
        label: "wiedzmin.bron.obrazenia",
      }),
      wartosc: new NumberField({
        initial: 0,
        required: true,
        label: "wiedzmin.bron.wartosc",
      }),
      wymagaAmunicji: new BooleanField({
        initial: false,
        label: "wiedzmin.bron.wymagaAmunicji",
      }),
      zapasAmunicji: new NumberField({
        initial: 2,
        label: "wiedzmin.bron.zapasAmunicji",
      }),
      opis: new HTMLField({
        label: "wiedzmin.bron.opis",
        initial: "",
        required: true,
      }),
    };
  }

  async sprawdzenieAmunicji() {
    const zapasAmunicji = this.zapasAmunicji;
    const formula = zapasAmunicji + "d6";
    const roll = new WiedzminRoll(
      formula,
      {},
      {
        type: "ammo",
        weaponId: this.parent._id,
        actorID: this.parent.parent.id,
      },
    );

    await roll.toMessage();
    const utrataAmunicji = roll.utrataAmunicji;
    if (utrataAmunicji) {
      const nowaAmunicja = Math.max(zapasAmunicji - utrataAmunicji, 0);
      await this.parent.update({ "system.zapasAmunicji": nowaAmunicja });
    }
  }
}
