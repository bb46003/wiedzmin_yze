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

export class postacDataModel extends foundry.abstract.TypeDataModel {
    static metadata = Object.freeze({});
 
static defineSchema() {
  return {
    atrybuty: new SchemaField({
      sila: new SchemaField({
        value: new NumberField({ label: "wiedzmin.atrubut.sila", initial: 0, required: true }),
        umiejetnosci: new SchemaField({
          krzepa: new NumberField({ label: "wiedzmin.atrubut.krzepa", initial: 0 }),
          walka_wrecz: new NumberField({ label: "wiedzmin.atrubut.walka_wrecz", initial: 0 }),
          wytrzymalosc: new NumberField({ label: "wiedzmin.atrubut.wytrzymalosc", initial: 0 }),
        })
      }),
      rozum: new SchemaField({
        value: new NumberField({ label: "wiedzmin.atrubut.rozum", initial: 0, required: true }),
        umiejetnosci: new SchemaField({
          spostrzegawczosc: new NumberField({ label: "wiedzmin.atrubut.spostrzegawczosc", initial: 0 }),
          fach: new NumberField({ label: "wiedzmin.atrubut.fach", initial: 0 }),
          wiedza: new NumberField({ label: "wiedzmin.atrubut.wiedza", initial: 0 }),
        })
      }),
      empatia: new SchemaField({
        value: new NumberField({ label: "wiedzmin.atrubut.empatia", initial: 0, required: true }),
        umiejetnosci: new SchemaField({
          wplyw: new NumberField({ label: "wiedzmin.atrubut.wplyw", initial: 0 }),
          manipulacja: new NumberField({ label: "wiedzmin.atrubut.manipulacja", initial: 0 }),
          wola: new NumberField({ label: "wiedzmin.atrubut.wola", initial: 0 }),
        })
      }),
      zrecznosc: new SchemaField({
        value: new NumberField({ label: "wiedzmin.atrubut.zrecznosc", initial: 0, required: true }),
        umiejetnosci: new SchemaField({
          zwinnosc: new NumberField({ label: "wiedzmin.atrubut.zwinnosc", initial: 0 }),
          walka_dystansowa: new NumberField({ label: "wiedzmin.atrubut.walka_dystansowa", initial: 0 }),
          zwinne_palce: new NumberField({ label: "wiedzmin.atrubut.zwinne_palce", initial: 0 }),
        })
      }),
    }),
    glod: new BooleanField({ label: "wiedzmin.glod", initial: false }),
    odwodnienie: new BooleanField({ label: "wiedzmin.odwodnienie", initial: false }),
    zmeczenie: new BooleanField({ label: "wiedzmin.zmeczenie", initial: false }),
    wychlodzenie: new BooleanField({ label: "wiedzmin.wychlodzenie", initial: false }),
    punkty_mocy: new NumberField({ label: "wiedzmin.punktyMocy", initial: 0 }),
    zycie: new NumberField({ label: "wiedzmin.zycie", initial: 0 }),
    adrenalina: new NumberField({ label: "wiedzmin.adrenalina", initial: 0 }),
    cele_osobiste: new StringField({ initial: "" }),
    pd: new NumberField({ label: "wiedzmin.pd", initial: 0 }),
    punkty_fabuly: new NumberField({ label: "wiedzmin.punktyFabuly", initial: 0, max: 3 }),
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
