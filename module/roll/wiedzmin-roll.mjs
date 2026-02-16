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

  static async create({ attribute = 0, skill = 0, adrenalina = 0, atrubutLabel = "", skillLabel = "" } = {}) {
    console.log(this)

    const content = await foundry.applications.handlebars.renderTemplate(
      this.DIALOG_TEMPLATE,
      { attribute, skill, adrenalina }
    );

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

          const roll = new WiedzminRoll(formula, {}, {
            adrenalina,
            flavor: "Test",
            atrubutLabel: atrubutLabel,
            skillLabel: skillLabel
          });

          await roll.toMessage();
        }
      }]
    }).render({ force: true });
  }

  /* -------------------------------------------- */
  /*  Evaluation Override (v13 style)             */
  /* -------------------------------------------- */

  async evaluate(options = {}) {
    await super.evaluate(options);
    this._analyze();
    return this;
  }

  /* -------------------------------------------- */
  /*  Dice Analysis                               */
  /* -------------------------------------------- */

  _analyze() {

    const diceTerms = this.terms.filter(t => t instanceof DiceTerm);

    const normalTerm     = diceTerms[0];
    const adrenalinaTerm = diceTerms[1];

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

    this._successes      = successes;
    this._extraSuccesses = Math.max(0, successes - 1);
    this._pech           = pech;
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
  /*  Chat Data Builder                           */
  /* -------------------------------------------- */

  _buildDicePart(term, type) {
    if (!term) return {};

    const rolls = term.results.map(roll => ({
      ...roll,
      classes:
        roll.result === 6 ? "max" :
        roll.result === 1 ? "min" :
        ""
    }));

    return { type, rolls };
  }

  async _prepareChatData(flavor) {

    // ensure analysis ran (evaluate already does it, but safe)
    if (!this._successes && this._successes !== 0) {
      this._analyze();
    }

    return {
      formula: this.formula,
      total: this.total,
      flavor: flavor ?? this.options.flavor,
      skillLabel: this.options.skillLabel,
      atrubutLabel: this.options.atrubutLabel,
      successes: this.successes,
      extraSuccesses: this.extraSuccesses,
      pech: this.pech,
      isSuccess: this.isSuccess,

      normalDice: this._buildDicePart(this._normalTerm, "normal"),
      adrenalinaDice: this._buildDicePart(this._adrenalinaTerm, "adrenalina")
    };
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async render({ flavor, template = this.constructor.CHAT_TEMPLATE } = {}) {

    if (!this._evaluated) await this.evaluate();

    const data = await this._prepareChatData(flavor);

    return foundry.applications.handlebars.renderTemplate(template, data);
  }

  /* -------------------------------------------- */
  /*  Chat Message Creation                       */
  /* -------------------------------------------- */

  async toMessage(messageData = {}, options = {}) {

    if (!this._evaluated) await this.evaluate();

    const content = await this.render();

    return ChatMessage.create({
      content,
      rolls: [this],
      ...messageData
    }, options);
  }
}
