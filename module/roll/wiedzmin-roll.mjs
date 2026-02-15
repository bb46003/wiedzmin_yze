const { DiceTerm } = foundry.dice.terms;

export class WiedzminRoll extends foundry.dice.Roll {

  static DIALOG_TEMPLATE = `systems/wiedzmin_yze/templates/dialogs/wiedzmin-roll.hbs`;
  static CHAT_TEMPLATE   = `systems/wiedzmin_yze/templates/chat/wiedzmin-roll.hbs`;

  constructor(formula, data = {}, options = {}) {
    super(formula, data, options);
    this.options.adrenalina ??= 0;
  }

  /* -------------------------------------------- */
  /*  Dialog Creator                              */
  /* -------------------------------------------- */

  static async create({ attribute = 0, skill = 0, adrenalina = 0 } = {}) {

    const content = await foundry.applications.handlebars.renderTemplate(
      this.DIALOG_TEMPLATE,
      { attribute, skill, adrenalina }
    );

    return new Promise(resolve => {

      new foundry.applications.api.DialogV2({
        window: { title: "Wiedzmin Roll" },
        content,
        buttons: [{
          action: "roll",
          label: "Roll",
          default: true,
          callback: async (_event, _button, dialog) => {

            const mod = Number(dialog.form?.elements?.modifier?.value) || 0;
            const basePool = attribute + skill + mod;

            const formula = adrenalina > 0
              ? `${basePool}d6 + ${adrenalina}d6`
              : `${basePool}d6`;

            const roll = new WiedzminRoll(formula, {}, { adrenalina, flavor: "Test" });

// make sure the roll is fully evaluated
 roll.evaluate({ async: true });

// now it is safe to build chat data
//const data = await this._prepareChatData(flavor, roll);

// create chat message
await roll.toMessage();

            resolve(roll);
          }
        }]
      }).render({ force: true });

    });
  }

  /* -------------------------------------------- */
  /*  Evaluation Override                         */
  /* -------------------------------------------- */

   evaluate(options = {}) {
    super.evaluate(options);
    this._analyze();
    return this;
  }

  /* -------------------------------------------- */
  /*  Dice Analysis                               */
  /* -------------------------------------------- */

  _analyze() {

    const diceTerms = this.terms.filter(t => t instanceof DiceTerm);

    const normalTerm      = diceTerms[0];
    const adrenalinaTerm  = diceTerms[1];

    let successes = 0;
    let pech = false;

    // NORMAL DICE
    if (normalTerm) {
      for (const r of normalTerm.results) {
        if (r.active && r.result === 6) successes++;
      }
    }

    // ADRENALINA DICE
    if (adrenalinaTerm) {
      for (const r of adrenalinaTerm.results) {
        if (!r.active) continue;

        if (r.result === 6) successes++;
        if (r.result === 1) pech = true;
      }
    }

    this._normalTerm     = normalTerm;
    this._adrenalinaTerm = adrenalinaTerm;

    this._successes       = successes;
    this._extraSuccesses  = Math.max(0, successes - 1);
    this._pech            = pech;
  }

  /* -------------------------------------------- */
  /*  Getters                                     */
  /* -------------------------------------------- */

  get successes() {
    return this._successes ?? 0;
  }

  get extraSuccesses() {
    return this._extraSuccesses ?? 0;
  }

  get pech() {
    return this._pech ?? false;
  }

  get isSuccess() {
    return this.successes > 0;
  }

  /* -------------------------------------------- */
  /*  Chat Data Builder   
                   
  /* -------------------------------------------- */

 async _buildDicePart(term, type) {
    

    const rolls = await term.results.forEach(roll => {
      return {...roll, classes : roll.result === 6 ? "max" : (roll.result === 1 ? "min" : "")};
    });
    
    console.log(rolls)
    return {
        type,
        rolls: rolls
        
    };
}


  async _prepareChatData( flavor  = {}, roll) {
    
    return {
      formula: roll.formula,
      total: roll.total,
      flavor: flavor ?? roll.options.flavor,

      successes: roll.successes,
      extraSuccesses: roll.extraSuccesses,
      pech: roll.pech,
      isSuccess: roll.isSuccess,
      
      normalDice: await this._buildDicePart(roll._normalTerm, "normal"),
      adrenalinaDice: await this._buildDicePart(roll._adrenalinaTerm, "adrenalina")
    };
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async render({ flavor, template = this.constructor.CHAT_TEMPLATE } = {}) {

    if (!this._evaluated) this.evaluate();
    const roll = this;
    const data = await this._prepareChatData( flavor , roll);
  
    return foundry.applications.handlebars.renderTemplate(template, data);
  }

  /* -------------------------------------------- */
  /*  Chat Message Creation                       */
  /* -------------------------------------------- */

  async toMessage(messageData = {}, options = {}) {

    if (!this._evaluated) this.evaluate();
    setTimeout(() => { 2500 });
    const content = await this.render();

    return ChatMessage.create({
      content,
      rolls: [this],
      ...messageData
    }, options);
  }

}
