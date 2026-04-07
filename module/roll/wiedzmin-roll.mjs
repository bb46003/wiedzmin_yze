const { DiceTerm } = foundry.dice.terms;

export class WiedzminRoll extends foundry.dice.Roll {
  static DIALOG_TEMPLATE = `systems/wiedzmin_yze/templates/dialogs/wiedzmin-roll.hbs`;
  static CHAT_TEMPLATE = `systems/wiedzmin_yze/templates/chat/wiedzmin-roll.hbs`;
  static DIALOG_CZRPANIE = `systems/wiedzmin_yze/templates/dialogs/wiedzmin-czerpanie.hbs`;
  static CHAT_CZERPANIE = `systems/wiedzmin_yze/templates/chat/wiedzmin-czerpanie.hbs`;
  static DIALOG_TEMPLATE_ATAK_BRONI = `systems/wiedzmin_yze/templates/dialogs/wiedzmin-atak-bronia.hbs`;
  static CHAT_TEMPLATE_ATAK_BRONI = `systems/wiedzmin_yze/templates/chat/wiedzmin-atak-bronia.hbs`;

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
    item,
    secondArtibute,
  } = {}) {
    const hasSecondAttribute =
      secondArtibute && Object.keys(secondArtibute).length > 0;
    const actor = await game.actors.get(actorID);
    const talenty = actor.items.filter((item) => item.type === "talenty");
    const maTelentBlokujacy = !talenty.some(
      (item) => item.system?.usuwaForsowanie === true,
    );

    const content = await foundry.applications.handlebars.renderTemplate(
      this.DIALOG_TEMPLATE,
      {
        attribute,
        skill,
        adrenalina,
        item,
        secondArtibute,
        hasSecondAttribute,
        maTelentBlokujacy,
      },
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
            let attributeVal = attribute;
            let atrubutLabelUse = atrubutLabel;
            let atrybutKeyUse = atrybutKey;
            if (hasSecondAttribute) {
              const select = dialog.element.querySelector(".wybrany-atr");
              const selectedOption = select.selectedOptions[0];

              attributeVal = Number(selectedOption.value);
              atrubutLabelUse = selectedOption.dataset.label;
              atrybutKeyUse = selectedOption.dataset.key;
            }
            const checked = Array.from(
              dialog.element.querySelectorAll('input[name="stosuje"]:checked'),
            );
            const selectedItems = checked.map((input) => {
              const index = Number(input.dataset.id);
              return item[index];
            });

            const talentBonus = await bonusZtalentów(selectedItems);
            const basePool = attributeVal + skill + mod + talentBonus;
            const formula =
              adrenalina > 0
                ? `${basePool}d6 + ${adrenalina}d6`
                : `${basePool}d6`;
            let flavor = "Test";
            if (!maTelentBlokujacy) {
              flavor = "Forsowanie";
            }
            const roll = new WiedzminRoll(
              formula,
              {},
              {
                adrenalina,
                flavor: flavor,
                atrubutLabel: atrubutLabelUse,
                umiejkaLabel: umiejkaLabel,
                actorID: actorID,
                umiejkaKey: umiejkaKey,
                atrybutKey: atrybutKeyUse,
                item: selectedItems,
                type: "roll",
              },
            );

            await roll.toMessage();
          },
        },
      ],
    }).render({ force: true });
  }

  static async czerpanieMocy({
    attribute = 0,
    skill = 0,
    adrenalina = 0,
    atrubutLabel = "",
    umiejkaLabel = "",
    actorID = null,
    bonusDoCzerpania = 0,
    item = [],
    secondArtibute = null,
    atrybutKey = "",
    umiejkaKey = "",
  } = {}) {
    const maTelentBlokujacy = !item.some(
      (item) => item.system?.usuwaForsowanie === true,
    );
    const content = await foundry.applications.handlebars.renderTemplate(
      this.DIALOG_CZRPANIE,
      {
        bonusDoCzerpania,
        attribute,
        skill,
        atrubutLabel,
        umiejkaLabel,
        adrenalina,
        item,
      },
    );
    new foundry.applications.api.DialogV2({
      window: { title: "Czerpanie Mocy" },
      content,
      buttons: [
        {
          action: "roll",
          label: "Roll",
          default: true,
          callback: async (_event, _button, dialog) => {
            const typ = dialog.element.querySelector(
              "select[name='elementType']",
            ).selectedOptions[0];
            const typValue = typ.value;
            const typMod = Number(typ.dataset.mod);
            const wielkosc = dialog.element.querySelector(
              "select[name='elementSize']",
            ).selectedOptions[0];
            const wielkoscValue = wielkosc.value;
            const wielkoscMod = Number(wielkosc.dataset.mod);
            const attributeVal = attribute;
            const atrubutLabelUse = atrubutLabel;
            const atrybutKeyUse = atrybutKey;
            const checked = Array.from(
              dialog.element.querySelectorAll('input[name="stosuje"]:checked'),
            );
            const selectedItems = checked.map((input) => {
              const index = Number(input.dataset.id);
              return item[index];
            });

            const talentBonus = await bonusZtalentów(selectedItems);
            const basePool =
              attributeVal +
              skill +
              typMod +
              wielkoscMod +
              bonusDoCzerpania +
              talentBonus;
            const formula =
              adrenalina > 0
                ? `${basePool}d6 + ${adrenalina}d6`
                : `${basePool}d6`;
            let flavor = "Test";
            if (!maTelentBlokujacy) {
              flavor = "Forsowanie";
            }
            const roll = new WiedzminRoll(
              formula,
              {},
              {
                adrenalina,
                flavor: flavor,
                atrubutLabel: atrubutLabelUse,
                umiejkaLabel: umiejkaLabel,
                actorID: actorID,
                umiejkaKey: umiejkaKey,
                atrybutKey: atrybutKeyUse,
                item: selectedItems,
                type: "czerpanie",
                zrodlo: typValue,
                wielkosc: wielkoscValue,
              },
            );
            await roll.toMessage();
          },
        },
      ],
    }).render({ force: true });
  }

  static async atakBronia({
    attribute = 0,
    skill = 0,
    adrenalina = 0,
    atrubutLabel = "",
    umiejkaLabel = "",
    actorID = null,
    item = [], // talents
    weaponId = null,
    attributesList = [],
    skillsList = [],
  } = {}) {
    const actor = await game.actors.get(actorID);
    const weapon = actor.items.get(weaponId);
    const maTelentBlokujacy = !item.some(
      (item) => item.system?.usuwaForsowanie === true,
    );
    if (!weapon) {
      ui.notifications.error("Weapon not found");
      return;
    }
    const content = await foundry.applications.handlebars.renderTemplate(
      this.DIALOG_TEMPLATE_ATAK_BRONI,
      {
        attributesList,
        skillsList,
        atrubutLabel,
        umiejkaLabel,
        adrenalina,
        item,
        hasSecondAttribute: false,
      },
    );
    const cel = game.user.targets;
    new foundry.applications.api.DialogV2({
      window: { title: `Attack: ${weapon.name}` },
      classes: ["wiedzmin-dialog", "atak"],
      content,
      buttons: [
        {
          action: "roll",
          label: "Attack",
          default: true,
          callback: async (_event, _button, dialog) => {
            // 🔹 modifier from dialog
            const mod = Number(dialog.form?.elements?.modifier?.value) || 0;

            // 🔹 selected talents
            const checked = Array.from(
              dialog.element.querySelectorAll('input[name="stosuje"]:checked'),
            );

            const selectedItems = checked.map((input) => {
              const index = Number(input.dataset.id);
              return item[index];
            });

            const talentBonus = await bonusZtalentów(selectedItems);
            const wybranyAtrybut = dialog.element.querySelector(
              'select[name="attribute"]',
            );
            const wybranaUmiejka = dialog.element.querySelector(
              'select[name="skill"]',
            );
            const atrybutWartosc = Number(
              wybranyAtrybut.selectedOptions[0].value,
            );
            const umiejkaWartosc = Number(
              wybranaUmiejka.selectedOptions[0].value,
            );
            const wybranyAtrybutLabel =
              wybranyAtrybut.selectedOptions[0].dataset.label;
            const wybranaUmiejkaLabel =
              wybranaUmiejka.selectedOptions[0].dataset.label;
            const basePool =
              atrybutWartosc + umiejkaWartosc + mod + talentBonus;
            const bonusDoObrazen =
              Number(dialog.element.querySelector(".bonusDoObrazen").value) ||
              0;
            const formula =
              adrenalina > 0
                ? `${basePool}d6 + ${adrenalina}d6`
                : `${basePool}d6`;
            let flavor = "Attack";
            if (!maTelentBlokujacy) {
              flavor = "Forsowanie";
            }
            const roll = new WiedzminRoll(
              formula,
              {},
              {
                adrenalina,
                flavor: flavor,
                atrubutLabel: wybranyAtrybutLabel,
                umiejkaLabel: wybranaUmiejkaLabel,
                actorID,
                item: selectedItems,
                type: "atak", // 🔥 IMPORTANT
                weaponId: weapon.id,
                weaponName: weapon.name,
                cel: cel,
                bonusDoObrazen: bonusDoObrazen,
              },
            );

            await roll.toMessage();
          },
        },
      ],
    }).render({ force: true });
  }

  static async parowanie({ 
    atrybutKey = "",
    atrybut = 0,
    umiejetnoscKey = "",
    umiejetnosc = 0,
    adrenalina,
    czymParujeszID = "",
    bonus = 0,
    modifier = 0,
    message = "" ,
    flavor = "",
    type = "parowanie",
    wybranetalenty= [],
    actorUUID = "",
   } = {}) {
    const bonusZTalentow = await bonusZtalentów(wybranetalenty);
    const actor = await fromUuid(actorUUID);
    let bron;
    if(czymParujeszID !== "reka"){
      bron = actor.items.get(czymParujeszID);
    }

    const bonusZBroni = bron?.system?.wartosc_efektu || 0;
    const basePool =
              atrybut + umiejetnosc + modifier + bonusZTalentow + bonusZBroni;
    const formula =
              adrenalina > 0
                ? `${basePool}d6 + ${adrenalina}d6`
                : `${basePool}d6`;
    const roll = new WiedzminRoll(
              formula,
              {},
              {
                adrenalina,
                flavor: flavor,
                atrubutLabel: "Siła",
                umiejkaLabel: "Walka Wręcz",
                actorID: actor.id,
                item: wybranetalenty,
                type: type,
                weaponId: bron?.id,
                weaponName: bron?.name || 'Ręka',
              },
            );
    await roll.toMessage();
    console.log(roll)
    return roll._successes
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

    if (
      this.options.oldsucesses !== 0 &&
      this.options.oldsucesses !== undefined
    ) {
      successes += this.options.oldsucesses;
    }
    this._normalTerm = normalTerm;
    this._adrenalinaTerm = adrenalinaTerm;

    this._successes = successes;
    this._extraSuccesses = Math.max(0, successes - 1);
    this._pech = pech;
    if (this.options.type === "ammo") {
      const normalTerm = this._normalTerm;

      let utrataAmunicji = false;

      if (normalTerm) {
        utrataAmunicji = normalTerm.results.some(
          (r) => r.active && r.result === 1,
        );
      }

      this._utrataAmunicji = utrataAmunicji;
    }
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
  get utrataAmunicji() {
    return this._utrataAmunicji ?? false;
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
    if (flavor === "Test" || flavor === "DodatkoweForsowanie") {
      forsowanie = true;
    } else if (flavor === "Forsowanie") {
      forsowanie = false;
    }
    if (options.newFormula) {
      formula = options.newFormula;
    }

    let extraSuccesses = this.extraSuccesses;

    let umiejkaLabel = this.options.umiejkaLabel;
    const actor = await game.actors.get(this.options.actorID);
    const fach = game.i18n.localize(
      wiedzmin_yze.config.fachy[actor.system.specjalizacjaFach].label,
    );
    if (this.options.umiejkaKey === "fach" && !umiejkaLabel.includes(fach)) {
      umiejkaLabel += " " + fach;
    }
    const itemsUuid = [];
    this.options?.item?.forEach((item) => {
      itemsUuid.push({ uuid: item.uuid, name: item.name });
    });
    let remainingAmmo = 0;
    if (this.options.type === "ammo") {
      const actor = await game.actors.get(this.options.actorID);
      const weapon = actor.items.get(this.options.weaponId);

      const zapasAmunicji = weapon.system.zapasAmunicji;

      remainingAmmo = Math.max(
        zapasAmunicji - (this.utrataAmunicji ? 1 : 0),
        0,
      );
    }
    const cele = this.options?.cel
      ? Array.from(this.options.cel).map((target) => {
          const token = canvas.tokens.get(target.id);
          return {
            name: token.name,
            id: target.id,
            img: token.document.texture.src,
          };
        })
      : [];
    return {
      formula: formula,
      total: this.total,
      flavor: flavor ?? this.options.flavor,
      umiejkaLabel: umiejkaLabel,
      atrubutLabel: this.options.atrubutLabel,
      umiejkaKey: this.options.umiejkaKey,
      atrybutKey: this.options.atrybutKey,
      successes: this.successes,
      extraSuccesses: extraSuccesses,
      pech: this.pech,
      isSuccess: this.isSuccess,
      forsowac: forsowanie,
      actorID: this.options.actorID,
      normalDice: this._buildDicePart(this._normalTerm, "normal"),
      adrenalinaDice: this._buildDicePart(this._adrenalinaTerm, "adrenalina"),
      iloscPrzerzuconych: options.iloscPrzerzuconych,
      item: itemsUuid,
      zrodlo: this.options?.zrodlo,
      wielkosc: this.options?.wielkosc,
      type: this.options?.type,
      remainingAmmo: remainingAmmo,
      utrataAmunicji: this.utrataAmunicji,
      cel: cele,
      bron: this.options?.weaponName,
      bronId: this.options?.weaponId,
      bonusDoObrazen: this.options?.bonusDoObrazen,
    };
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async render({ flavor, options = {} } = {}) {
    if (!this._evaluated) await this.evaluate();
    let template = "";

    switch (options.type) {
      case "czerpanie":
        template = this.constructor.CHAT_CZERPANIE;
        break;
      case "ammo":
        template =
          "systems/wiedzmin_yze/templates/chat/wiedzmin-sprawdzenieAmo.hbs";
        break;
      case "atak":
        template = this.constructor.CHAT_TEMPLATE_ATAK_BRONI;
        break;
      default:
        template = this.constructor.CHAT_TEMPLATE;
    }
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
    const data = await this.render({
      flavor: this.options.flavor,
      options: this.options,
    });
    const message = await ChatMessage.create(
      {
        system: data.data,
        content: data.content,
        rolls: [this],
        ...messageData,
      },
      options,
    );

    return { message, utrataAmunicji: this.utrataAmunicji };
  }
}

async function bonusZtalentów(item) {
  let bonusZTalentow = 0;
  item.forEach((telent) => {
    if (telent.system.bonu !== 0) {
      bonusZTalentow += telent.system.bonu;
    }
  });
  return bonusZTalentow;
}
