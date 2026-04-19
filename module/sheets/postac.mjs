import { staticID, toLabelObject } from "../utils.mjs";

const { api, sheets } = foundry.applications;

export class postacSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2,
) {
  constructor(...args) {
    super(...args);

    /** @type {CharacterActor} */
    this.actor;
  }
  static DEFAULT_OPTIONS = {
    classes: ["postac-sheet"],
    position: { width: 1020, height: 850 },
    actions: {
      toggleCondition: postacSheet._onToggleCondition,
      rzut_atrybut: postacSheet.#rzut_atrybut,
      rzut_umiejka: postacSheet.#rzut_umiejka,
      editText: postacSheet._onEditText,
      rzut_talen: postacSheet.#rzut_talen,
      itemContextMenu: postacSheet.#itemContextMenu,
      otwórzRase: postacSheet.#otwórzRase,
      pobierzMoc: postacSheet.#pobierzMoc,
      uzyjPrzedmiotu: postacSheet.#uzyjPrzedmiotu,
      sprawdzenieAmunicji: postacSheet.#sprawdzenieAmunicji,
      atakBronia: postacSheet.#atakBronia,
      rzucCzar: postacSheet.#rzucCzar,
      parowanie: postacSheet.#parowanie,
    },
    form: {
      submitOnChange: true,
    },
  };
  static PARTS = {
    tabs: {
      id: "tabs",
      template: `systems/wiedzmin_yze/templates/postac/glowna.hbs`,
    },
    zasoby: {
      id: "tabs",
      template: "systems/wiedzmin_yze/templates/postac/resources.hbs",
    },
    statusy: {
      id: "tabs",
      template: "systems/wiedzmin_yze/templates/postac/conditions.hbs",
    },
    atrybuty: {
      id: "tabs",
      template: "systems/wiedzmin_yze/templates/postac/attributes.hbs",
    },
    talenty: {
      template: "systems/wiedzmin_yze/templates/postac/talents.hbs",
    },
    bronie: {
      template: "systems/wiedzmin_yze/templates/postac/weapons.hbs",
    },
    eq: {
      id: "tabs",
      template: "systems/wiedzmin_yze/templates/postac/equipment.hbs",
    },
    notatki: {
      id: "tabs",
      template: "systems/wiedzmin_yze/templates/postac/notes.hbs",
    },
    czary: {
      template: "systems/wiedzmin_yze/templates/postac/czary.hbs",
    },
    nac: {
      template: "systems/wiedzmin_yze/templates/postac/nav.hbs",
    },
  };
  static TABS = {
    items: {
      tabs: [
        { id: "bronie", group: "items", label: "" },
        { id: "talenty", group: "items", label: "" },
        { id: "czary", group: "items", label: "" },
      ],
      initial: "bronie",
    },
  };
  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, {
      actor: this.actor,
      source: this.actor.toObject(),
      system: this.actor.system,
      fields: this.actor.schema.fields,
      systemFields: this.actor.system.schema.fields,
    });
    const atrybyty = ["sila", "rozum", "empatia", "zrecznosc"];
    atrybyty.forEach((key) => {
      context.systemFields.atrybuty.fields[key].fields.value.max =
        this.actor.system.atrybuty[key].max;
    });
    const { conditions } = await this._prepareConditions();
    Object.assign(context, { conditions });
    const talenty = await this.prepareTelenty();
    Object.assign(context, { talenty });
    const rasa = await this.prepareRasa();
    Object.assign(context, { rasa });
    const umiejkiZawodowe = await this.umiejkiZawodowe();
    Object.assign(context, { umiejkiZawodowe });
    const profesja = await this.prepareProfesja();
    Object.assign(context, { profesja });
    async function enrich(html) {
      if (html) {
        return await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          html,
          {
            secrets: game.user.isOwner,
            async: true,
          },
        );
      } else {
        return html;
      }
    }
    context.ekwipunek = {
      value: this.actor.system.ekwipunek,
      enriched: await enrich(this.actor.system.ekwipunek),
      field: this.actor.system.schema.fields.ekwipunek,
    };
    const brakForsowania = await this.forsowanie();
    Object.assign(context, { brakForsowania });
    const bronie = await this.prepareBronie();
    Object.assign(context, { bronie });
    const pancerz = await this.preparePancerz();
    Object.assign(context, { pancerz });
    const czary = await this.prepareCzary();
    Object.assign(context, { czary });

    return context;
  }

  /**
   * Prepare conditions for display.
   *
   * @returns {Promise<{ conditions: Record<string, unknown>[], specialConditions: Record<string, unknown>[] }>}
   */
  async _prepareConditions() {
    const allEffects = {
      ...wiedzmin_yze.config.CONDITIONS,
    };

    const conditions = Object.entries(allEffects)
      .filter(([, effect]) => effect.hud?.actorTypes?.includes("postac"))
      .map(([id, effect]) => {
        const { name, reference, img: icon } = effect;
        const docId = staticID(`wyze${id}`);
        const existingEffect = this.actor.effects.get(docId);
        const { active, img } = existingEffect ?? {};

        return {
          name: game.i18n.localize(name),
          img: img || icon || "icons/svg/mystery-man.svg",
          id,
          reference,
          disabled: !active,
          cssClass: [active ? "active" : ""].filterJoin(" "),
          combined: "conditions" in effect,
        };
      })
      .filter(Boolean);

    return { conditions };
  }
  async forsowanie() {
    const talenty = this.actor.items.filter((item) => item.type === "talenty");

    const maTelentBlokujacy = talenty.some(
      (item) => item.system?.usuwaForsowanie === true,
    );

    return !maTelentBlokujacy;
  }
  async prepareTelenty() {
    const talenty = this.actor.items.filter((item) => item.type === "talenty");
    const data = {};
    talenty.forEach((talent) => {
      const itemID = talent.id;
      const iamge = talent.img;
      const itemName = talent.name;
      const rzucany = talent.system.rzucany;
      const czerpanieMocy = talent.system.czerpanieMocy;
      data[itemID] = {
        img: iamge,
        name: itemName,
        rzucany: rzucany,
        czerpanieMocy: czerpanieMocy,
      };
    });

    return data;
  }
  async prepareRasa() {
    const rasa = this.actor.items.filter((item) => item.type === "rasa")[0];
    if (rasa) {
      const data = { id: rasa.id, rasaName: rasa.name };

      return data;
    }
  }
  async prepareProfesja() {
    const profesja = this.actor.items.filter(
      (item) => item.type === "profesja",
    )[0];
    if (profesja) {
      const data = { id: profesja.id, profesjaName: profesja.name };

      return data;
    }
  }
  async umiejkiZawodowe() {
    const profesja = this.actor.items.filter(
      (item) => item.type === "profesja",
    )[0];
    if (profesja) {
      return profesja?.flags?.wiedzmin_yze?.wybraneUmiejki || [];
    } else {
      return [];
    }
  }
  async prepareBronie() {
    const bronie = this.actor.items.filter((item) => item.type === "bron");
    const data = {};
    bronie.forEach((bron) => {
      const itemID = bron.id;
      const img = bron.img;
      const name = bron.name;
      const celnosc = bron.system.celnosc;
      const obrazenia = bron.system.obrazenia;
      const wartosc = bron.system.wartosc;
      const zapasAmunicji = bron.system.zapasAmunicji;
      const wymagaAmunicji = bron.system.wymagaAmunicji;

      data[itemID] = {
        img,
        name,
        celnosc,
        obrazenia,
        wartosc,
        zapasAmunicji,
        wymagaAmunicji,
      };
    });

    return data;
  }
  async preparePancerz() {
    const pancerz = this.actor.items.filter((item) => item.type === "pancerz");
    const data = {};
    pancerz.forEach((pancerzItem) => {
      const itemID = pancerzItem.id;
      const img = pancerzItem.img;
      const name = pancerzItem.name;
      const efekt = pancerzItem.system.efekt;
      const wartosc_efektu = pancerzItem.system.wartosc_efektu;
      const wartosc = pancerzItem.system.wartosc;
      const wyparowanie = pancerzItem.system.wyparowanie;

      data[itemID] = {
        img,
        name,
        efekt,
        wartosc_efektu,
        wartosc,
        wyparowanie,
      };
    });

    return data;
  }
  async prepareCzary() {
    const czary = this.actor.items.filter((item) => item.type === "czar");
    const data = {};
    czary.forEach((czar) => {
      const itemID = czar.id;
      const img = czar.img;
      const name = czar.name;
      const poziom = czar.system.poziom;
      const koszt = czar.system.koszt;
      const zasieg = czar.system.zasieg;

      data[itemID] = {
        img,
        name,
        poziom,
        koszt,
        zasieg,
      };
    });

    return data;
  }
  async _onDrop(event) {
    event.preventDefault();

    const data = event.dataTransfer;
    const actor = this.actor;
    let stworzPrzedmiot = false;
    if (!data) return;

    const droppedItem = JSON.parse(data.getData("text/plain"));
    if (droppedItem.type !== "Item") return;

    const itemDoc = await fromUuid(droppedItem.uuid);
    let itemData = itemDoc.toObject(); // IMPORTANT

    switch (itemData.type) {
      case "talenty": {
        const wydaneXp = itemData.system.kosztTalentu;

        actor.system.wydanieXP(wydaneXp, itemData);

        if (itemData.system.zwiekszneiePM) {
          actor.system.zwiekszMoc(itemData.system.dodatkowaMoc);
        }
        await actor.createEmbeddedDocuments("Item", [itemData]);
        break;
      }

      case "rasa": {
        await this.dodanieRasy(itemData, {});

        break;
      }
      case "profesja": {
        const posiadaProfesje = this.actor.items.filter(
          (i) => i.type === "profesja",
        );
        if (posiadaProfesje.length === 0) {
          await this.dodanieProfesji(itemData);
        } else {
          ui.notifications.warn(
            `Postać posiada już Profesje, usuń ją zanim dodasz nową!`,
          );
        }

        break;
      }
      case "czar": {
        const maMoc = this.actor.system.punkty_mocy.max;
        if (maMoc === 0) {
          ui.notifications.warn(
            "Twoja Postać nie posiada Punktów Mocy i nie może znać Czarów",
          );
        } else {
          await actor.createEmbeddedDocuments("Item", [itemData]);
        }
        break;
      }

      default:
        await actor.createEmbeddedDocuments("Item", [itemData]);
        break;
    }
  }
  /** @inheritDoc */
  _processFormData(event, form, formData) {
    let name = event?.target?.name;
    const isString = typeof name;

    if (!(isString === "string")) {
      name = event?.target?.name.name;
    }

    if (
      name === "system.adrenalina.value" ||
      name === "system.zycie.value" ||
      name === "system.punkty_mocy.value"
    ) {
      const value = Number(event.target.value);
      formData.object[name] = event.target.checked ? value : value - 1;
    }

    if (name !== "system.adrenalina.value") {
      const inputsAdrenalina = Array.from(
        form.querySelectorAll("[name='system.adrenalina.value']"),
      );
      formData.object["system.adrenalina.value"] =
        this.getMax(inputsAdrenalina);
    }
    if (name !== "system.zycie.value") {
      const inputsZycie = Array.from(
        form.querySelectorAll("[name='system.zycie.value']"),
      );
      formData.object["system.zycie.value"] = this.getMax(inputsZycie);
    }
    if (name !== "system.punkty_mocy.value") {
      const inputsMoc = Array.from(
        form.querySelectorAll("[name='system.punkty_mocy.value']"),
      );
      formData.object["system.punkty_mocy.value"] = this.getMax(inputsMoc);
    }
    if (name.includes("atrybuty") && name.includes("value")) {
      const value = Number(event.target.value);
      const splitName = name.split(".");
      const atr = splitName[2];
      const max = this.actor.system.atrybuty[atr].max;
      if (value > max) {
        formData.object[`system.zycie.atrybuty.${atr}.value`] = max;
        ui.notifications.warn(
          `Wprowadzono wartość atrybutu ${atr} większą od maksymalnej`,
        );
      }
    }
    if(name.includes("name")){
     this.actor.system.zmianaTokenow(formData.object.name)
    }

    return super._processFormData(event, form, formData);
  }

  getMax(inputs) {
    // Convert to objects with numeric value and checked status
    const values = inputs.map((input) => ({
      value: Number(input.value),
      checked: input.checked,
    }));

    // Sort by numeric value ascending
    values.sort((a, b) => a.value - b.value);

    let maxValue = 0; // Default if none checked in sequence

    for (const item of values) {
      if (item.checked) {
        maxValue = item.value; // update max as long as sequence continues
      } else {
        break; // first unchecked stops the sequence
      }
    }

    return maxValue;
  }
  /**
   * Toggle a single condition, either enabling and adding it to the actor, or disabling and removing it.
   *
   * @this {CharacterSheetMM3}}
   * @param {PointerEvent} event
   */
  static async _onToggleCondition(event) {
    const conditionId = event.target.closest("[data-condition-id]")?.dataset
      .conditionId;
    return this.actor.toggleStatusEffect(conditionId);
  }

  static async #rzut_umiejka(ev) {
    const umiejka = ev.target.dataset.umiejka;
    const atrybut = ev.target.dataset.atrybut;
    this.actor.system.rzutUmiejka(umiejka, atrybut);
  }

  static async #rzut_atrybut(ev) {
    const atrybut = ev.target.dataset.atrybut;
    this.actor.system.rzutAtrybut(atrybut);
  }

  static async #rzut_talen(ev) {
    const target = ev.target;
    const itemID = target.parentNode.dataset.item;
    const item = this.actor.items.get(itemID);
    const atrybut = item.system.powiazaneAtrybuty;
    let umiejka = item.system.powiazanaUmiejka;
    const fach = wiedzmin_yze.config?.umiejki[umiejka];
    if (fach?.umiejkaKey) {
      umiejka = fach.umiejkaKey;
    } else {
      umiejka = umiejka.toLowerCase();
    }
    if (umiejka === "brak") {
      this.actor.system.rzutAtrybut(atrybut, item);
    } else {
      this.actor.system.rzutUmiejka(umiejka, atrybut);
    }
  }

  static async #itemContextMenu(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    const button = ev.target;
    const itemId = button.parentElement.dataset.item;
    const item = this.actor.items.get(itemId);
    // Remove old menu if exists
    document.querySelector(".custom-context-menu")?.remove();

    // Create element instead of raw string (safer and cleaner)
    const menu = document.createElement("div");
    menu.classList.add("custom-context-menu");
    if (item.type === "talenty") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Talent</div>
    <div class="menu-option" data-action="delete">Usuń Talent</div>
  `;
    }
    if (item.type === "rasa") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Rase</div>
    <div class="menu-option" data-action="delete">Usuń Rase</div>
  `;
    }
    if (item.type === "profesja") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Profesję</div>
    <div class="menu-option" data-action="delete">Usuń Profesje</div>
  `;
    }
    if (item.type === "bron") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Broń</div>
    <div class="menu-option" data-action="delete">Usuń Broń</div>
  `;
    }
    if (item.type === "pancerz") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Pancerz</div>
    <div class="menu-option" data-action="delete">Usuń Pancerz</div>
  `;
    }
    if (item.type === "czar") {
      menu.innerHTML = `
    <div class="menu-option" data-action="open">Otwórz Czar</div>
    <div class="menu-option" data-action="delete">Usuń Czar</div>
  `;
    }

    // Position at mouse location
    menu.style.position = "absolute";
    menu.style.left = `${ev.pageX}px`;
    menu.style.top = `${ev.pageY}px`;
    menu.style.zIndex = 1000;

    document.body.appendChild(menu);

    // Attach click handler
    menu.addEventListener("click", async (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      if (action === "open") {
        const item = this.actor.items.get(itemId);
        item?.sheet.render(true);
      }

      if (action === "delete") {
        const item = this.actor.items.get(itemId);
        if (item.type === "talenty") {
          const xp = item.system.kosztTalentu;
          await this.actor.system.zwrocPD(xp, item);
          if (item.system.zwiekszneiePM) {
            await this.actor.system.zmniejszneieMocy(item.system.dodatkowaMoc);
          }
        }
        if (item.type === "rasa") {
          const podbicieAtrybutu = item.system.bonusyAtrybuty;
          this.actor.system._bonusZRasyUsun(podbicieAtrybutu);
          if (item.system.zapewniaBonusDoUmiejki) {
            const podbicieUmiejki = item.system.bonusyUmiejki;
            this.actor.system._bonusZRasyUmiejkaUsun(podbicieUmiejki);
          }
        }
        if ((item.type = "profesja")) {
          const atrybutWiodacy = item.flags?.wiedzmin_yze?.atrybutWiodacy;
          if (atrybutWiodacy) {
            this.actor.system._usunAtrWiodacy(atrybutWiodacy);
          }
          if (item.system.talenty) {
            item.system.talenty.forEach(async (talent) => {
              const itemTalent = await fromUuid(talent.uuid);
              itemTalent?.delete();
            });
          }
          if (item.system.ograniczaAtrybut) {
            await this.actor.system._przywrucAtr(
              item.system.ograniczonyAtrybut,
            );
          }
        }
        await item?.delete();
      }

      menu.remove();
    });

    // Close when clicking elsewhere
    setTimeout(() => {
      document.addEventListener("click", () => menu.remove(), { once: true });
    }, 10);
  }

  static async #pobierzMoc(ev) {
    const items = this.actor.items;
    let bonusDoCzerpania = 0;
    items.forEach((item) => {
      if (
        item.type === "talent" &&
        item.system?.bonusCzerpaniaMocy !== 0 &&
        item.system?.bonusCzerpaniaMocy !== undefined
      ) {
        bonusDoCzerpania++;
      }
    });
    await this.actor.system.pobierzMoc(
      bonusDoCzerpania,
      items.filter((i) => i.type === "talenty"),
    );
  }

  static async #otwórzRase(ev) {
    const target = ev.target;
    const rasaID = target.dataset.id;
    const rasa = this.actor.items.get(rasaID);
    rasa.sheet.render({ force: true });
  }

  static async #sprawdzenieAmunicji(ev) {
    const target = ev.target;
    const bronID = target.dataset.id;
    const bron = this.actor.items.get(bronID);
    await bron.system.sprawdzenieAmunicji();
  }

  static async #atakBronia(ev) {
    const target = ev.target;
    const bronID = target.dataset.id;
    const bron = this.actor.items.get(bronID);
    const bronJestDystansowa = bron.system.wymagaAmunicji;
    let atrybut = "sila";
    let umiejka = "walka_wrecz";
    if (bronJestDystansowa) {
      atrybut = "zrecznosc";
      umiejka = "walka_dystansowa";
    }
    await this.actor.system.atakBronia(bronID, atrybut, umiejka);
  }
  static async #rzucCzar(ev) {
    const target = ev.target;
    const czarID = target.dataset.id;
    const atrybut = "rozum";
    const umiejka = "fach";
    await this.actor.system.rzucanieCzaru(czarID, atrybut, umiejka);
  }

  static async #parowanie(ev) {
    const target = ev.target;
    const bronID = target.dataset.id;
    const actor = this.actor;
    const bronie = actor.items.filter((i) => i.type === "bron");
  bronie.forEach((b) => {
    czymParujesz.push({ name: b.name, id: b.id, bonus: 0 });
  });

  const maTelentBlokujacy = targetActor.items.some(
    (item) => item.system?.usuwaForsowanie === true,
  );
const czytarcza = targetActor.items.filter(
    (i) => i.type === "pancerz" && i.system.efekt === "parowanie",
  );

  const czymParujesz = [{ name: "Ręka", id: "reka", bonus: 0 }];

  if (czytarcza.length !== 0) {
    czymParujesz.push(
      ...czytarcza.map((b) => ({
        name: b.name,
        id: b.id,
        bonus: b.system.wartosc_efektu,
      })),
    );
  }
  let flavor = maTelentBlokujacy ? "Forsowanie" : "Test";

  const { powiazaneTalenty: inneTalenty } =
    await targetActor.system.sprawdzTalenty("sila", []);

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/wiedzmin_yze/templates/dialogs/parowanie-dialog.hbs",
    { czymParujesz: czymParujesz, talenty: inneTalenty, bronID: bronID },
  );
 new foundry.applications.api.DialogV2({
      window: { title: `Parowanie - ${targetActor.name}` },
      content: content,
      buttons: [
        {
          action: "paruj",
          label: "Paruj",
          default: true,
          callback: async (_event, _button, dialog) => {
            const selection = dialog.element.querySelector(".parowanie");

            const czymParujeszID = selection.selectedOptions[0].dataset.id;

            const bonus = Number(
              selection.selectedOptions[0].dataset.bonus || 0,
            );

            const modifier =
              parseInt(
                dialog.element.querySelector("input[name='modifier']")?.value,
              ) || 0;

            const atrybut = targetActor.system.atrybuty.sila.value;
            const umiejetnosc =
              targetActor.system.atrybuty.sila.umiejetnosci.walka_wrecz;

            const checked = Array.from(
              dialog.element.querySelectorAll('input[name="stosuje"]:checked'),
            );

            const selectedItems = checked.map((input) => {
              const index = Number(input.dataset.id);
              return inneTalenty[index]; // ✅ fixed
            });

            const adrenalina = targetActor.system.adrenalina.value;

            const result = await globalThis.wiedzmin_yze.WiedzminRoll.parowanie(
              {
                atrybutKey: "sila",
                atrybut,
                umiejetnoscKey: "walka_wrecz",
                umiejetnosc,
                adrenalina,
                czymParujeszID,
                bonus,
                modifier,
                messageID: message.id,
                flavor: flavor,
                type: "parowanie",
                wybranetalenty: selectedItems,
                actorUUID: targetActor.uuid,
              },
            );
            result.toMessage();

            
          },
        },
      ],
    }).render({ force: true });
  
  }

  async _onRender(document, options) {
    await super._onRender(document, options);
    const id = document.rootId;
    const element = document.document.apps[id].element;
    element.classList.remove("light");
    element.classList.remove("dark");
    const appTheme = game.settings.get("core", "uiConfig").colorScheme
      .applications;
    element.classList.add(appTheme);

    const uzyciePrzedmiotu = element.querySelector(
      "[data-action='uzyjPrzedmiotu']",
    );
    if (uzyciePrzedmiotu) {
      uzyciePrzedmiotu.addEventListener("contextmenu", (ev) =>
        postacSheet.#uzyjPrzedmiotu(ev, this.actor.id),
      );
    }
  }

  static async #uzyjPrzedmiotu(ev, actorId) {
    let actor = this.actor;
    if (actor === undefined) {
      actor = await game.actors.get(actorId);
    }
    // LEFT CLICK
    if (ev.button === 0) {
      const adrenalina = actor.system.adrenalina.value;
      const nowaAdrenalina = adrenalina - 2 < 0 ? 0 : adrenalina - 2;
      if (this.actor.system.uzyto_przedmiotu) {
        ui.notifications.warn(
          "Przedmiot charakterystyczny został już użyty. Możesz go zresetować klikając prawym przyciskiem myszy.",
        );
      } else {
        await actor.update({
          ["system.adrenalina.value"]: nowaAdrenalina,
          ["system.uzyto_przedmiotu"]: true,
        });

        ChatMessage.create({
          speaker: { actor: actor.id },
          content: `Użyto przedmiot charakterystyczny, tracąc 2 punkty adrenaliny.
Z obecnego poziomu ${adrenalina} do ${nowaAdrenalina}`,
        });
      }
    }
    // RIGHT CLICK
    if (ev.button === 2) {
      await actor.update({
        ["system.uzyto_przedmiotu"]: false,
      });

      ChatMessage.create({
        speaker: { actor: actor.id },
        content: `Zresetowano użycie przedmiotu charakterystycznego.`,
      });
    }
  }

  static async _onEditText(_event, target) {
    const { fieldPath, propertyPath } = target.dataset;
    // If there is a document (e.g. an item) to be found in a parent element, assume the field is relative to that
    const doc = (await this.getDocument?.(target)) ?? this.document;
    // Get field from schema
    const field = doc.system.schema.getField(
      fieldPath.replace(/^system\./, "") ??
        propertyPath.replace(/^system\./, ""),
    );
    const editor = new TextEditorApplication({ document: doc, field });
    editor.render({ force: true });
  }

  async dodanieProfesji(itemData) {
    const daneItem = itemData.system;
    const umiejkiDowyboru = daneItem.umiejetnosciZawodowe
      .filter((e) => e.wybor)
      .map((e) => ({
        ...e,
        label: game.i18n.localize(
          wiedzmin_yze.config.umiejki[e.umiejka]?.label ?? "-",
        ),
        umiejkaAlternatywnaLabel: game.i18n.localize(
          wiedzmin_yze.config.umiejki[e.umiejkaAlternatywna]?.label ?? "-",
        ),
      }));
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/wiedzmin_yze/templates/dialogs/przydziel-rase.hbs",
      {
        rasy: daneItem.rasy,
        celeOsobiste: daneItem.celeOsobiste,
        charakterystycznyPrzedmiot: daneItem.charakterystycznyPrzedmiot,
        umiejkiDowyboru: umiejkiDowyboru,
        atrybutWiodacy: daneItem.atrybutWiodacy,
      },
    );
    const dane = await new Promise((resolve) => {
      if (
        daneItem.rasy.length !== 0 ||
        daneItem.atrybutWiodacy.length !== 1 ||
        daneItem.celeOsobiste.length !== 0 ||
        daneItem.charakterystycznyPrzedmiot.length !== 0 ||
        daneItem.umiejkiDowyboru !== undefined
      ) {
        const dialog = new foundry.applications.api.DialogV2({
          window: { title: "Wybory z Profesji" },
          content,
          buttons: [
            {
              label: "zastosuj",
              action: "zastosuj",
              callback: async (_event, _button, dialog) => {
                const html = dialog.element;
                const result = {};

                // rasa
                const rasa = html.querySelector(".input-rasa");
                if (rasa) result.rasa = rasa.value;

                // cel osobisty
                const celTextarea = html.querySelector(
                  'textarea[data-id="celOsobisty"]',
                );
                const celSelect = html.querySelector(".input-cele");

                if (celTextarea?.value.trim()) {
                  result.celOsobisty = celTextarea.value.trim();
                } else if (celSelect) {
                  result.celOsobisty =
                    daneItem.celeOsobiste[Number(celSelect.value)];
                }

                // przedmiot
                const itemTextarea = html.querySelector(
                  'textarea[data-id="charakterystycznyPrzedmiot"]',
                );
                const itemSelect = html.querySelector(".input-przedmiot");

                if (itemTextarea?.value.trim()) {
                  result.charakterystycznyPrzedmiot = itemTextarea.value.trim();
                } else if (itemSelect) {
                  result.charakterystycznyPrzedmiot =
                    daneItem.charakterystycznyPrzedmiot[itemSelect.value];
                }

                // umiejętności
                result.umiejetnosci = [
                  ...html.querySelectorAll(".input-umiejka"),
                ].map((s) => s.value);

                //atrybut
                const atrSelect = html.querySelector(".input-atrybut");
                if (atrSelect) {
                  result.atrybutWiodacy =
                    daneItem.atrybutWiodacy[atrSelect.value];
                }

                resolve(result);
              },
            },
          ],
        });
        dialog.render({ force: true });
      } else {
        const result = {};
        result.celOsobisty = daneItem.celOsobisty;
        result.charakterystycznyPrzedmiot = daneItem.charakterystycznyPrzedmiot;
        result.umiejetnosci = daneItem.umiejetnosciZawodowe.map(
          (element) => element.umiejka,
        );
        resolve(result);
      }
    });

    const dataUpdate = {
      "system.zamoznosc": daneItem.zamoznosc,
      "system.cele_osobiste": dane.celOsobisty,
      "system.charakterystyczny_przedmiot": dane.charakterystycznyPrzedmiot,
      "system.ekwipunek": daneItem.ekwipunek,
    };
    const rasa = await fromUuid(dane.rasa);

    const powiazaneTalenty = daneItem.talenty;
    const actor = this.actor;
    await this.powiazaneTalenty(powiazaneTalenty, itemData, actor);
    const profsjaItem = await actor.createEmbeddedDocuments("Item", [itemData]);

    await profsjaItem[0].setFlag(
      "wiedzmin_yze",
      "wybraneUmiejki",
      dane.umiejetnosci,
    );
    await profsjaItem[0].setFlag(
      "wiedzmin_yze",
      "atrybutWiodacy",
      dane.atrybutWiodacy || daneItem.atrybutWiodacy,
    );

    await actor.system.atrybutWiodacy(
      dane.atrybutWiodacy || daneItem.atrybutWiodacy,
    );

    await actor.update(dataUpdate);
    if (rasa) {
      const rasaItem = rasa.toObject();
      await this.dodanieRasy(rasaItem, profsjaItem[0]);
    }
  }

  async dodanieRasy(itemData, profesja) {
    let wybraneUmiejki = [];
    const actor = this.actor;
    const posiadanaRasa = actor.items.filter((i) => i.type === "rasa");
    const posiadanaProfesja = profesja;
    const rasyProfesji = posiadanaProfesja?.system?.rasy;
    const hasMatchingName = rasyProfesji?.some(
      (item) => item.name === posiadanaRasa[0]?.name,
    );
    if (posiadanaRasa.length > 0 && Object.keys(profesja).length === 0) {
      ui.notifications.warn(
        "Postać posiada już rasę. Usuń ją zanim dodasz nową.",
      );
      return;
    }
    if (!hasMatchingName && posiadanaRasa.length !== 0) {
      ui.notifications.warn(
        "Postać posiada inną rasę niż wymagana do Profesji",
      );
      await profesja?.delete();
      return;
    }
    if (posiadanaRasa.length !== 0 && hasMatchingName) {
      return;
    }

    const powiazaneTalenty = itemData.system.talenty;

    await this.powiazaneTalenty(powiazaneTalenty, itemData, actor);
    const podbicieAtrybutu = itemData.system.bonusyAtrybuty;
    this.actor.system._bonusZRasy(podbicieAtrybutu);
    if (
      itemData.system.zapewniaBonusDoUmiejki &&
      !itemData.system.wybieraneUmiejki
    ) {
      const podbicieUmiejki = itemData.system.bonusyUmiejki;
      this.actor.system._bonusZRasyUmiejka(podbicieUmiejki);
      const item = await actor.createEmbeddedDocuments("Item", [itemData]);
    }
    if (itemData.system.wybieraneUmiejki) {
      const umiejkiZprofesji =
        profesja?.flags?.wiedzmin_yze.wybraneUmiejki || [];
      const umiejki = wiedzmin_yze.config.umiejki;
      const umiejkiDowyboru = Object.fromEntries(
        Object.entries(umiejki).filter(
          ([key]) => !umiejkiZprofesji.includes(key),
        ),
      );
      const content = await foundry.applications.handlebars.renderTemplate(
        "systems/wiedzmin_yze/templates/dialogs/przydziel-umiejki-rasa.hbs",
        {
          umiejkiDowyboru: umiejkiDowyboru,
          ilosc: itemData.system.iloscUmiejekDoWyboru,
        },
      );
      wybraneUmiejki = await new Promise((resolve) => {
        const dialog = new foundry.applications.api.DialogV2({
          window: { title: "Wybory z Profesji" },
          content,
          buttons: [
            {
              label: "Zastosuj",
              action: "zastosuj",
              callback: (_event, _button, dlg) => {
                const values = [
                  ...dlg.element.querySelectorAll("select.input-umiejka"),
                ]
                  .map((s) => s.value)
                  .filter(Boolean);
                resolve(values);
              },
            },
          ],
        });

        // --- Override _onRender AFTER creating the dialog ---
        dialog._onRender = function () {
          const selectors = this.element.querySelectorAll(
            "select.input-umiejka",
          );
          const initialValue = selectors[0].value;
          selectors.forEach((otherSelect) => {
            if (otherSelect === selectors[0]) return; // skip the select that changed

            // Enable all options first
            Array.from(otherSelect.options).forEach((opt) => {
              opt.disabled = false;
            });

            // Disable the option that matches the selected value
            const optionToDisable = otherSelect.querySelector(
              `option[value="${initialValue}"]`,
            );
            if (optionToDisable) optionToDisable.disabled = true;

            // If the disabled option is currently selected, reset the select
            if (otherSelect.value === initialValue) {
              otherSelect.value = "";
            }
          });
          selectors.forEach((select) => {
            select.addEventListener("change", (ev) => {
              const target = ev.target; // the select that triggered the change
              const selectedValue = target.value;

              // Loop through all selects
              selectors.forEach((otherSelect) => {
                if (otherSelect === target) return; // skip the select that changed

                // Enable all options first
                Array.from(otherSelect.options).forEach((opt) => {
                  opt.disabled = false;
                });

                // Disable the option that matches the selected value
                const optionToDisable = otherSelect.querySelector(
                  `option[value="${selectedValue}"]`,
                );
                if (optionToDisable) optionToDisable.disabled = true;

                // If the disabled option is currently selected, reset the select
                if (otherSelect.value === selectedValue) {
                  otherSelect.value = "";
                }
              });
            });
          });
        };

        // Render the dialog
        dialog.render(true);
      });

      const podbicieUmiejki = [];
      wybraneUmiejki.forEach((key) => {
        const dane = {
          umiejka: key,
          bonus: 1,
        };
        podbicieUmiejki.push(dane);
      });

      this.actor.system._bonusZRasyUmiejka(podbicieUmiejki);
    }

    if (itemData.system.ograniczaAtrybut) {
      await this.actor.system._ograniczaAtr(itemData.system.ograniczonyAtrybut);
    }
    if (itemData.system.wybieraneAtrybuty) {
      const iloscAtrybutow = itemData.system.iloscWybieranychAtrybutuow;
      const wartosc = itemData.system.bonusDoWybranych;
      const choices = {
        sila: game.i18n.localize("wiedzmin.atrubut.sila"),
        zrecznosc: game.i18n.localize("wiedzmin.atrubut.zrecznosc"),
        empatia: game.i18n.localize("wiedzmin.atrubut.empatia"),
        rozum: game.i18n.localize("wiedzmin.atrubut.rozum"),
      };
      itemData.system.ograniczonyAtrybut.forEach((atr) => {
        delete choices[atr.atrybut];
      });

      const wybory = [];
      for (let i = 0; i < iloscAtrybutow; i++) {
        const dane = { lista: choices, wartosc: wartosc };
        wybory.push(dane);
      }
      const content = await foundry.applications.handlebars.renderTemplate(
        "systems/wiedzmin_yze/templates/dialogs/przydziel-atrybuty.hbs",
        {
          wybory: wybory,
        },
      );
      await new Promise((resolve) => {
        const dialog = new foundry.applications.api.DialogV2({
          window: { title: "Wybory z Rasy" },
          content,
          buttons: [
            {
              label: "zastosuj",
              action: "zastosuj",
              default: true,
              callback: async (_event, _button, dialog) => {
                const atrybuty = dialog.element.querySelectorAll(".atrybuty");
                const dane = [];
                atrybuty.forEach((atr, index) => {
                  const data = {
                    bonus: Number(atr.dataset.bonus),
                    atrybut: atr.value,
                  };
                  dane.push(data);
                  itemData.system.bonusyAtrybuty[index] = data;
                });
                this.actor.system._bonusZRasy(dane);
                const item = await actor.createEmbeddedDocuments("Item", [
                  itemData,
                ]);
                if (wybraneUmiejki.length > 0) {
                  item[0].setFlag(
                    "wiedzmin_yze",
                    "wybraneUmiejki",
                    wybraneUmiejki,
                  );
                }
              },
            },
          ],
        });
        dialog._onRender = function () {
          const selectors = this.element.querySelectorAll("select.atrybuty");
          const initialValue = selectors[0].value;
          selectors.forEach((otherSelect) => {
            if (otherSelect === selectors[0]) return; // skip the select that changed

            // Enable all options first
            Array.from(otherSelect.options).forEach((opt) => {
              opt.disabled = false;
            });

            // Disable the option that matches the selected value
            const optionToDisable = otherSelect.querySelector(
              `option[value="${initialValue}"]`,
            );
            if (optionToDisable) optionToDisable.disabled = true;

            // If the disabled option is currently selected, reset the select
            if (otherSelect.value === initialValue) {
              otherSelect.value = "";
            }
          });
          selectors.forEach((select) => {
            select.addEventListener("change", (ev) => {
              const target = ev.target; // the select that triggered the change
              const selectedValue = target.value;

              // Loop through all selects
              selectors.forEach((otherSelect) => {
                if (otherSelect === target) return; // skip the select that changed

                // Enable all options first
                Array.from(otherSelect.options).forEach((opt) => {
                  opt.disabled = false;
                });

                // Disable the option that matches the selected value
                const optionToDisable = otherSelect.querySelector(
                  `option[value="${selectedValue}"]`,
                );
                if (optionToDisable) optionToDisable.disabled = true;

                // If the disabled option is currently selected, reset the select
                if (otherSelect.value === selectedValue) {
                  otherSelect.value = "";
                }
              });
            });
          });
        };
        dialog.render({ force: true });
      });
    } else {
      const item = await actor.createEmbeddedDocuments("Item", [itemData]);
      if (wybraneUmiejki.length > 0) {
        item[0].setFlag("wiedzmin_yze", "wybraneUmiejki", wybraneUmiejki);
      }
    }
  }
  async powiazaneTalenty(powiazaneTalenty, itemData, actor) {
    for (let i = 0; i < powiazaneTalenty.length; i++) {
      const sourceTalent = await fromUuid(powiazaneTalenty[i].uuid);

      const created = await actor.createEmbeddedDocuments("Item", [
        sourceTalent.toObject(),
      ]);
      const newItem = created[0];
      itemData.system.talenty[i].uuid = newItem.uuid;
    }
  }
}
