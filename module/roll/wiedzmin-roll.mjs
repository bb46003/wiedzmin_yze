const { DiceTerm } = foundry.dice.terms;

export class WiedzminRoll extends foundry.dice.Roll {
  static DIALOG_TEMPLATE = `systems/wiedzmin_yze/templates/dialogs/wiedzmin-roll.hbs`;
  static CHAT_TEMPLATE = `systems/wiedzmin_yze/templates/chat/wiedzmin-roll.hbs`;

  constructor(formula, data = {}, options = {}) {
    super(formula, data, options);
    this.options.adrenalina ??= 0;
  }

  /* -------------------------------------------- */
  /*  Dialog Creator                              */
  /* -------------------------------------------- */

  static async create({
    attribute = 0,
    skill = 0,
    adrenalina = 0,
    atrubutLabel = "",
    umiejkaLabel = "",
    actorID = null,
    umiejkaKey = "",
    atrybutKey = "",
  } = {}) {
    const content = await foundry.applications.handlebars.renderTemplate(
      this.DIALOG_TEMPLATE,
      { attribute, skill, adrenalina },
    );

    new foundry.applications.api.DialogV2({
      window: { title: "Wiedzmin Roll" },
      content,
      buttons: [
        {
          action: "roll",
          label: "Roll",
          default: true,
          callback: async (_event, _button, dialog) => {
            const mod = Number(dialog.form?.elements?.modifier?.value) || 0;
            const basePool = attribute + skill + mod;

            const formula =
              adrenalina > 0
                ? `${basePool}d6 + ${adrenalina}d6`
                : `${basePool}d6`;

            const roll = new WiedzminRoll(
              formula,
              {},
              {
                adrenalina,
                flavor: "Test",
                atrubutLabel: atrubutLabel,
                umiejkaLabel: umiejkaLabel,
                actorID: actorID,
                umiejkaKey: umiejkaKey,
                atrybutKey: atrybutKey,
              },
            );

            await roll.toMessage();
          },
        },
      ],
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
    const diceTerms = this.terms.filter((t) => t instanceof DiceTerm);

    const normalTerm = diceTerms[0];
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

    this._normalTerm = normalTerm;
    this._adrenalinaTerm = adrenalinaTerm;

    this._successes = successes;
    this._extraSuccesses = Math.max(0, successes - 1);
    this._pech = pech;
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

    const rolls = term.results
      .map((roll) => ({
        ...roll,
        classes:
          roll.result === 6
            ? "max"
            : roll.result === 1 && type === "adrenalina"
              ? "min"
              : "",
      }))
      .sort((a, b) => b.result - a.result); // malejąco

    return { type, rolls };
  }

  async _prepareChatData(flavor, options) {
    // ensure analysis ran (evaluate already does it, but safe)
    if (!this._successes && this._successes !== 0) {
      this._analyze();
    }
    let forsowanie = true;
    let formula = this._formula;
    if (flavor === "Test") {
      forsowanie = true;
    } else if (flavor === "Forsowanie") {
      forsowanie = false;
    }
    if (options.newFormula) {
      formula = options.newFormula;
    }
    let extraSuccesses = this.extraSuccesses;
    if (options.oldsucesses) {
      extraSuccesses = this.extraSuccesses + options.oldsucesses;
    }
    return {
      formula: formula,
      total: this.total,
      flavor: flavor ?? this.options.flavor,
      umiejkaLabel: this.options.umiejkaLabel,
      atrubutLabel: this.options.atrubutLabel,
      umiejkaKey: this.options.umiejkaKey,
      atrybutKey: this.options.atrybutKey,
      successes: this.successes,
      extraSuccesses: extraSuccesses,
      pech: this.pech,
      isSuccess: this.isSuccess,
      forsowac: forsowanie, // TODO: logic for this from items or conditions
      actorID: this.options.actorID,
      normalDice: this._buildDicePart(this._normalTerm, "normal"),
      adrenalinaDice: this._buildDicePart(this._adrenalinaTerm, "adrenalina"),
    };
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async render({
    flavor,
    template = this.constructor.CHAT_TEMPLATE,
    options = {},
  } = {}) {
    if (!this._evaluated) await this.evaluate();

    const data = await this._prepareChatData(flavor, options);
    const content = await foundry.applications.handlebars.renderTemplate(
      template,
      data,
    );
    return { content, data };
  }

  /* -------------------------------------------- */
  /*  Chat Message Creation                       */
  /* -------------------------------------------- */

  async toMessage(messageData = {}, options = {}) {
    if (!this._evaluated) await this.evaluate();
    const { content, data } = await this.render({
      flavor: this.options.flavor,
      template: this.constructor.CHAT_TEMPLATE,
      options,
    });

    return ChatMessage.create(
      {
        system: data,
        content,
        rolls: [this],
        ...messageData,
      },
      options,
    );
  }
}
