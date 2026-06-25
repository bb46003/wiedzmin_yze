import { addHtmlEventListener } from "../utils.mjs";
import { WiedzminRoll } from "../roll/wiedzmin-roll.mjs";

export function addChatListeners(_app, html, _data) {
  addHtmlEventListener(html, "click", ".forsuj-button", forsujRzut, _app);
  addHtmlEventListener(html, "click", ".openTalenet", otworzTalent, _app);
  addHtmlEventListener(html, "click", ".zaczerpMoc-button", zaczerpMoc, _app);
  addHtmlEventListener(html, "click", ".zadaj-obrazenia", zadajObrazenia, _app);
  addHtmlEventListener(html, "click", ".parowanie", parowanie, _app);
  addHtmlEventListener(html, "click", ".unik", unik, _app);
  addHtmlEventListener(html, "click", ".stworz-template", stworzTemplate, _app);
  addHtmlEventListener(html, "click", ".rzut-obrazenia", rzutObrazen, _app);
  addHtmlEventListener(
    html,
    "click",
    ".zadaj-obrazenia-czar",
    zadajObrazeniaCzar,
    _app,
  );
  addHtmlEventListener(
    html,
    "click",
    ".rzut-obrazenia-czar",
    rzutObrazeniaCzar,
    _app,
  );
  addHtmlEventListener(html, "click", ".obrona_czar", rzutObronnyCzar, _app);
}
async function forsujRzut(event, message) {
  const data = message.system;
  if (!data) return;

  const actor = game.actors.get(data.actorID);
  if (!actor) return;

  const normalRolls = data.normalDice?.rolls ?? [];
  const adrenalinaRolls = data.adrenalinaDice?.rolls ?? [];

  // --- SUKCESY ---
  const normalSuccesses = normalRolls.filter(
    (r) => r.active && r.result === 6,
  ).length;

  const adrenalinaSuccesses = adrenalinaRolls.filter(
    (r) => r.active && r.result === 6,
  ).length;

  // --- NOWA PULA PODSTAWOWA ---
  let newBasePool = normalRolls.length - normalSuccesses;

  // jeśli był sukces na adrenalina → odejmujemy 1 podstawową
  if (adrenalinaSuccesses > 0 && newBasePool > 0) {
    newBasePool -= adrenalinaSuccesses;
  }

  if (newBasePool < 0) newBasePool = 0;

  // zwiększamy poziom adrenaliny aktora
  await actor.system.zwiekszAdrenaline();

  // --- NOWA PULA ADRENALINY ---
  const updatedActor = game.actors.get(data.actorID);
  const newAdrenalinaPool = updatedActor.system.adrenalina.value;

  // --- BUDOWANIE FORMUŁY ---
  let formula = "";

  if (newBasePool > 0) formula += `${newBasePool}d6`;

  if (newAdrenalinaPool > 0) {
    if (formula) formula += " + ";
    formula += `${newAdrenalinaPool}d6`;
  }
  let dodatkoweForsowanie = false;
  const items = data.item;
  if (data.flavor !== "DodatkoweForsowanie") {
    for (const uuid of items) {
      const doc = await fromUuid(uuid.uuid);
      if (doc.system?.dodatkoweForsowanie === true) {
        dodatkoweForsowanie = true;
        break; // no need to continue
      }
    }
  }
  const newRoll = new WiedzminRoll(
    formula,
    {},
    {
      adrenalina: newAdrenalinaPool,
      flavor: dodatkoweForsowanie ? "DodatkoweForsowanie" : "Forsowanie",
      atrubutLabel: data.atrubutLabel,
      umiejkaLabel: data.umiejkaLabel,
      actorID: data.actorID,
      umiejkaKey: data.umiejkaKey,
      atrybutKey: data.atrybutKey,
      item: data.item,
      type: data.type,
      zrodlo: data?.zrodlo,
      wielkosc: data?.wielkosc,
      oldsucesses: normalSuccesses + adrenalinaSuccesses,
    },
  );
  await newRoll.evaluate();
  newRoll._normalTerm.results.push(
    ...normalRolls
      .filter((r) => r.result === 6)
      .map((r) => ({ ...r, active: true, classes: "max" })),
    ...adrenalinaRolls
      .filter((r) => r.result === 6)
      .map((r) => ({ ...r, active: true, classes: "max" })),
  );
  newRoll?._adrenalinaTerm.results.sort((a, b) => b.result - a.result);
  newRoll?._normalTerm.results.sort((a, b) => b.result - a.result);
  const split = data.formula.split("+");
  const adrenalinaPart = newAdrenalinaPool + "d6";
  const normalPart = split[0]?.trim() ?? "";
  const newFormula = normalPart + " + " + adrenalinaPart;
  await newRoll.toMessage(
    {},
    {
      iloscPrzerzuconych: `${newBasePool}dn`,
      newFormula: newFormula,
      oldsucesses: normalSuccesses + adrenalinaSuccesses,
    },
  );
  const oryginalMessage = game.messages.get(data.messageID);
  event.target.disabled = true;
  if (data.messageID !== "" && data.messageID !== undefined) {
    if (!oryginalMessage) return;
    const obronaCzar = oryginalMessage.flags?.wiedzmin_yze?.obronaCzar;
    if (obronaCzar) {
      const maSukces = newRoll.isSuccess;
      let wynikObrony = -1;

      if (maSukces) {
        wynikObrony = newRoll.extraSuccesses + 1;
      }
      const targetID =
        oryginalMessage.flags.wiedzmin_yze.targetActor[data.actorID];
      const index = oryginalMessage.system.cel.findIndex(
        (obj) => obj.id === targetID,
      );
      if (index !== -1) {
        const celArray = foundry.utils.deepClone(oryginalMessage.system.cel);

        celArray[index].obrona = wynikObrony;

        await oryginalMessage.update({
          "system.cel": celArray,
        });
      }

      const template = "systems/wiedzmin_yze/templates/chat/wiedzmin-czar.hbs";
      const messageContent =
        await foundry.applications.handlebars.renderTemplate(
          template,
          oryginalMessage.system,
        );
      await oryginalMessage.setFlag("wiedzmin_yze", "obronaCzar", true);
      await oryginalMessage.update(
        { content: messageContent },
        { wiedzminUpdate: true },
      );
    }
    // update system data
    await oryginalMessage.update({
      "system.wyparowane": newRoll.successes,
    });
    const targetId = oryginalMessage.system.cel[0].id;

    const parser = new DOMParser();
    const doc = parser.parseFromString(oryginalMessage.content, "text/html");

    const target = doc.querySelector(
      `.target-token[data-targetid="${targetId}"]`,
    );

    if (!target) return;

    const resultDiv = target.querySelector(".parowanie-result");
    if (resultDiv) {
      resultDiv.textContent = `Parowanie: ${newRoll.successes}`;
    }

    const button = target.querySelector(".parowanie");
    if (button) {
      button.disabled = true; // optional logic
    }

    const newContent = doc.body.innerHTML;

    await oryginalMessage.update({ content: newContent });
  } else {
    await oryginalMessage.update({ "system.forsowac": false });
    oryginalMessage.render({ force: true });
  }
}
async function otworzTalent(ev) {
  const target = ev.target;
  const item = await fromUuid(target.dataset.itemid);
  const itemName = item.name;
  const opis = item.system.opis;
  if (item.type === "czar") {
    const czar = await item.sheet.render({ force: true });
    czar.element.querySelector(".talents-section").classList.add("disable");
  } else {
    new foundry.applications.api.DialogV2({
      window: { title: `Talent ${itemName}` },
      content: opis,
      buttons: [
        {
          action: "ok",
          label: "Zamknij",
          default: true,
          callback: async (_event, _button, dialog) => {
            dialog.close();
          },
        },
      ],
    }).render({ force: true });
  }
}
async function zaczerpMoc(event, message) {
  const data = message.system;
  if (!data) return;

  const actor = game.actors.get(data.actorID);
  if (!actor) return;
  const flavor = data.flavor;
  const zrodlo = data.zrodlo;
  const normalRolls = data.normalDice?.rolls ?? [];
  const adrenalinaRolls = data.adrenalinaDice?.rolls ?? [];

  // --- SUKCESY ---
  const normalSuccesses = normalRolls.filter(
    (r) => r.active && r.result === 6,
  ).length;

  const adrenalinaSuccesses = adrenalinaRolls.filter(
    (r) => r.active && r.result === 6,
  ).length;
  const pech = adrenalinaRolls.some((r) => r.active && r.result === 1);
  const typZrodla = data.zrodlo;
  const wielkoscZrodla = data.wielkosc;
  const maksymalnaMoc = actor.system.punkty_mocy.max;
  const aktualnaMoc = actor.system.punkty_mocy.value;
  const brakujacaMoc = maksymalnaMoc - aktualnaMoc;
  const mocZaczerpnieta = normalSuccesses + adrenalinaSuccesses;
  const updateData = {};
  if (flavor === "Forsowanie" || zrodlo === "ogien") {
    const mocZOgnia =
      zrodlo === "ogien" ? 2 * mocZaczerpnieta : mocZaczerpnieta;
    const nadwyzkaMocy = mocZOgnia - brakujacaMoc;
    if (nadwyzkaMocy > 0) {
      const obecneZycie = actor.system.zycie.value;
      const noweZycie = obecneZycie - nadwyzkaMocy;
      updateData["system.zycie.value"] = noweZycie < 0 ? 0 : noweZycie;
      updateData["system.punkty_mocy.value"] = maksymalnaMoc;
      ChatMessage.create({
        speaker: { actor: actor.id },
        content: `
          Moc czerpano ze źródła ${typZrodla} o wielkości ${wielkoscZrodla}. Zaczerpnięto ${mocZOgnia} 
          punktów mocy. Moc przed zaczerpnięciem to ${aktualnaMoc}. 
          Aktualna moc po zaczerpnięciu to ${updateData["system.punkty_mocy.value"]}.
          Nadwyżka ${nadwyzkaMocy} została odjęta od życia, 
          z wartości ${obecneZycie} do ${updateData["system.zycie.value"]}.`,
      });
    } else {
      updateData["system.punkty_mocy.value"] = aktualnaMoc + mocZOgnia;
      ChatMessage.create({
        speaker: { actor: actor.id },
        content: `
          Moc czerpano ze źródła ${typZrodla} o wielkości ${wielkoscZrodla}. Zaczerpnięto ${mocZOgnia} 
          punktów mocy. Moc przed zaczerpnięciem to ${aktualnaMoc}. 
          Aktualna moc po zaczerpnięciu to ${updateData["system.punkty_mocy.value"]}.`,
      });
    }
  } else {
    const mocZwykla = mocZaczerpnieta;
    const nadwyzkaMocy = mocZwykla - brakujacaMoc;
    if (nadwyzkaMocy > 0 && pech) {
      const obecneZycie = actor.system.zycie.value;
      const noweZycie = obecneZycie - nadwyzkaMocy;
      updateData["system.zycie.value"] = noweZycie < 0 ? 0 : noweZycie;
      updateData["system.punkty_mocy.value"] = maksymalnaMoc;
      ChatMessage.create({
        speaker: { actor: actor.id },
        content: `
          Moc czerpano ze źródła ${typZrodla} o wielkości ${wielkoscZrodla}. Zaczerpnięto ${mocZwykla} 
          punktów mocy. Moc przed zaczerpnięciem to ${aktualnaMoc}. 
          Aktualna moc po zaczerpnięciu to ${updateData["system.punkty_mocy.value"]}.
          Nadwyżka ${nadwyzkaMocy} została odjęta od życia, 
          z wartości ${obecneZycie} do ${updateData["system.zycie.value"]}.`,
      });
    } else {
      updateData["system.punkty_mocy.value"] = aktualnaMoc + mocZwykla;
      ChatMessage.create({
        speaker: { actor: actor.id },
        content: `
          Moc czerpano ze źródła ${typZrodla} o wielkości ${wielkoscZrodla}. Zaczerpnięto ${mocZwykla} 
          punktów mocy. Moc przed zaczerpnięciem to ${aktualnaMoc}. 
          Aktualna moc po zaczerpnięciu to ${updateData["system.punkty_mocy.value"]}.`,
      });
    }
  }
  await actor.update(updateData);
  event.target.disabled = true;
}
async function zadajObrazenia(event, message) {
  const data = message.system;
  if (!data) return;

  const actor = game.actors.get(data.actorID);
  if (!actor) return;
  const cel = data.cel;
  const bronId = data.bronId;
  let bron;
  let obrazenia;
  if (typeof bronId === String) {
    bron = actor.items.get(bronId);
    obrazenia = bron.system.obrazenia;
  } else {
    bron = bronId;
    obrazenia = bronId.obrazenia;
  }
  const telenty = data.item;
  let modifikatorObrazen = 0;
  for (const uuid of telenty) {
    const item = await fromUuid(uuid.uuid);
    if (item.system?.modifikatorObrazen) {
      modifikatorObrazen += item.system.zwiekszoneObrazenia;
    }
  }
  const dodatkoweObrazenia = await new Promise((resolve) => {
    new foundry.applications.api.DialogV2({
      window: { title: `Dodatkowe obrażenia` },
      content: `
        <div class="form-group">
        <label> Dostene jest ${data.successes - 1} dodatkowych sukcesów. Czy chcesz je wykorzystać do zwiększenia obrażeń?</label>
        </div>
        <div class="form-group">
          <label for="extraSuccesses">Dodatkowe sukcesy:</label>
          <input type="number" name="extraSuccesses" id="extraSuccesses" value="0" max="${data.extraSuccesses}" min="0">
        </div>
      `,
      buttons: [
        {
          action: "confirm",
          label: "Potwierdź",
          default: true,
          callback: async (_event, _button, dialog) => {
            const extraSuccesses =
              parseInt(
                dialog.element.querySelector("input[name='extraSuccesses']")
                  .value,
              ) || 0;
            resolve(extraSuccesses);
          },
        },
      ],
    }).render({ force: true });
  });

  const zadaneObrazenia = [];

  if (cel.length > 0) {
    await Promise.all(
      cel.map(async (target) => {
        const celToken = canvas.tokens.get(target.id);
        const celActor = celToken.actor;
        let wyparowanoObrazen = data?.wyparowane;
        if (wyparowanoObrazen) {
          wyparowanoObrazen = wyparowanoObrazen[target?.id];
        } else {
          wyparowanoObrazen = 0;
        }

        const calkowiteObrazenia =
          obrazenia +
          modifikatorObrazen +
          data.bonusDoObrazen +
          dodatkoweObrazenia;

        const zadaneObrzenia =
          calkowiteObrazenia - wyparowanoObrazen < 0
            ? 0
            : calkowiteObrazenia - wyparowanoObrazen;
        const maPancerz = celActor.items.find((i) => i.type === "pancerz");
        let redukcjaObrazen = 0;
        if (maPancerz) {
          redukcjaObrazen = maPancerz.system.wyparowanie || 0;
        }
        const obecneZycie = celActor.system.zycie.value;
        const noweZycie =
          obecneZycie - (zadaneObrzenia - redukcjaObrazen) > obecneZycie
            ? obecneZycie
            : obecneZycie - (zadaneObrzenia - redukcjaObrazen);
        if (game.user.isGM) {
          await celActor.update({
            "system.zycie.value": noweZycie < 0 ? 0 : noweZycie,
          });
        } else {
          const dataUpdate = {
            actorId: celActor.id,
            update: { "system.zycie.value": noweZycie < 0 ? 0 : noweZycie },
          };
          game.socket.emit("system.wiedzmin_yze", {
            type: "zadajObrazenia",
            updateData: dataUpdate,
          });
        }

        zadaneObrazenia.push({
          cel: celActor.name,
          obrazenia: zadaneObrzenia - redukcjaObrazen,
          zyciePrzed: obecneZycie,
          zyciePo: noweZycie < 0 ? 0 : noweZycie,
          redukcjaObrazen: redukcjaObrazen,
          maPancerz: maPancerz,
        });
      }),
    );
    let obrazeniaContent = "";
    zadaneObrazenia.forEach((z) => {
      obrazeniaContent += `<br> Cel: ${z.cel}`;
      if (z.maPancerz) {
        obrazeniaContent += `<br> Redukcja obrażeń z pancerza: ${z.redukcjaObrazen}`;
      }
      if (data.wyparowane > 0) {
        obrazeniaContent += `<br> Wyparowoano obrażeń: ${wyparowanoObrazen}`;
      }
      if (data?.uniki > 0) {
        obrazeniaContent += `<br> Uniknięto obrażeń: ${data.uniki}`;
      }
      obrazeniaContent += `
        <br> Obrażenia zadane: ${z.obrazenia}, Życie przed: ${z.zyciePrzed}, Życie po: ${z.zyciePo}
      `;
    });
    const calkowiteObrazenia =
      obrazenia + modifikatorObrazen + data.bonusDoObrazen + dodatkoweObrazenia;
    ChatMessage.create({
      speaker: { actor: actor.id },
      content: `Całkowite zadane obrażenia: ${calkowiteObrazenia}.
      <br> Obrażenia z broni ${bron.name} (${obrazenia})
      <br> Modyfikatory z talentów (${modifikatorObrazen})
      <br> Innych źródeł (${data.bonusDoObrazen})
      <br> Ze dodatkowe sukcesy (${dodatkoweObrazenia}),
      <br> Zadane obrażenia: ${obrazeniaContent}
      `,
    });
  } else {
    ChatMessage.create({
      speaker: { actor: actor.id },
      content: `Całkowite zadane obrażenia: ${calkowiteObrazenia}.
      <br> Obrażenia z broni ${bron.name} (${obrazenia})
      <br> Modyfikatory z talentów (${modifikatorObrazen})
      <br> Innych źródeł (${data.bonusDoObrazen})
      <br> Ze dodatkowe sukcesy (${dodatkoweObrazenia})`,
    });
  }
  event.target.disabled = true;
}
async function rzutObrazen(event, message) {
  const data = message.system;
  if (!data) return;

  const actor = game.actors.get(data.actorID);
  if (!actor) return;
  const bronId = data.bronId;
  let bron;
  let obrazenia;
  if (typeof bronId === String) {
    bron = actor.items.get(bronId);
    obrazenia = bron.system.obrazenia;
  } else {
    bron = bronId;
    obrazenia = bronId.obrazenia;
  }

  const telenty = data.item;
  let modifikatorObrazen = 0;
  for (const uuid of telenty) {
    const item = await fromUuid(uuid.uuid);
    if (item.system?.modifikatorObrazen) {
      modifikatorObrazen += item.system.zwiekszoneObrazenia;
    }
  }
  const dodatkoweObrazenia = await new Promise((resolve) => {
    new foundry.applications.api.DialogV2({
      window: { title: `Dodatkowe obrażenia` },
      content: `
        <div class="form-group">
        <label> Dostene jest ${data.extraSuccesses} dodatkowych sukcesów. Czy chcesz je wykorzystać do zwiększenia obrażeń?</label>
        </div>
        <div class="form-group">
          <label for="extraSuccesses">Dodatkowe sukcesy:</label>
          <input type="number" name="extraSuccesses" id="extraSuccesses" value="0" max="${data.extraSuccesses}" min="0">
        </div>
      `,
      buttons: [
        {
          action: "confirm",
          label: "Potwierdź",
          default: true,
          callback: async (_event, _button, dialog) => {
            const extraSuccesses =
              parseInt(
                dialog.element.querySelector("input[name='extraSuccesses']")
                  .value,
              ) || 0;
            resolve(extraSuccesses);
          },
        },
      ],
    }).render({ force: true });
  });
  const calkowiteObrazenia =
    obrazenia + modifikatorObrazen + data.bonusDoObrazen + dodatkoweObrazenia;

  ChatMessage.create({
    speaker: { actor: actor.id },
    content: `Całkowite zadane obrażenia: ${calkowiteObrazenia}.
      <br> Obrażenia z broni ${bron.name} (${obrazenia})
      <br> Modyfikatory z talentów (${modifikatorObrazen})
      <br> Innych źródeł (${data.bonusDoObrazen})
      <br> Ze dodatkowe sukcesy (${dodatkoweObrazenia})`,
  });

  event.target.disabled = true;
}
async function parowanie(event, message) {
  const targetId = event.target.dataset.targetid;
  const targetToken = canvas.tokens.get(targetId);
  if (!targetToken) return;

  const targetActor = targetToken.actor;
  if (!targetActor) return;

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

  const bronie = targetActor.items.filter((i) => i.type === "bron");
  bronie.forEach((b) => {
    czymParujesz.push({ name: b.name, id: b.id, bonus: 0 });
  });

  const maTelentBlokujacy = targetActor.items.some(
    (item) => item.system?.usuwaForsowanie === true,
  );

  let flavor = maTelentBlokujacy ? "Forsowanie" : "Test";

  const { powiazaneTalenty: inneTalenty } =
    await targetActor.system.sprawdzTalenty("sila", []);
  let mod = 0;
  if (message.system?.czar) {
    mod = message.system.czar.system.obrona.modyfikator || 0;
  }
  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/wiedzmin_yze/templates/dialogs/parowanie-dialog.hbs",
    { czymParujesz: czymParujesz, talenty: inneTalenty, mod: mod },
  );

  const wyparowanoObrazen = await new Promise((resolve) => {
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

            resolve(result);
          },
        },
      ],
    }).render({ force: true });
  });
  if (message.system.czar) {
    let wynikObrony = -1;

    if (wyparowanoObrazen > 0) {
      wynikObrony = wyparowanoObrazen;
    }

    const index = message.system.cel.findIndex((obj) => obj.id === targetId);
    if (index !== -1) {
      const celArray = foundry.utils.deepClone(message.system.cel);

      celArray[index].obrona = wynikObrony;

      await message.update({
        "system.cel": celArray,
      });
    }

    const template = "systems/wiedzmin_yze/templates/chat/wiedzmin-czar.hbs";
    const messageContent = await foundry.applications.handlebars.renderTemplate(
      template,
      message.system,
    );
    await message.setFlag("wiedzmin_yze", "obronaCzar", true);
    await message.setFlag("wiedzmin_yze", "targetActor", {
      [targetActor.id]: targetId,
    });
    await message.update({ content: messageContent }, { wiedzminUpdate: true });
  } else {
    await message.update({
      "system.wyparowane": wyparowanoObrazen,
    });
    const resultHTML = `<div class="parowanie-result">Parowanie: -${wyparowanoObrazen}</div>`;

    const button = event.target.closest("button.parowanie");
    button.insertAdjacentHTML("afterend", resultHTML);
    let updatedContent = message.content.replace(
      /(<button[^>]*class="[^"]*parowanie[^"]*"[^>]*)(>[\s\S]*?<\/button>)/,
      `$1 disabled$2${resultHTML}`,
    );
    updatedContent = updatedContent.replace(
      /(<button[^>]*class="[^"]*unik[^"]*"[^>]*)(>[\s\S]*?<\/button>)/,
      `$1 disabled$2`,
    );

    await message.update({ content: updatedContent });
  }
}
async function unik(event, message) {
  const targetId = event.target.dataset.targetid;
  const targetToken = canvas.tokens.get(targetId);
  if (!targetToken) return;

  const targetActor = targetToken.actor;
  if (!targetActor) return;
  const maTelentBlokujacy = targetActor.items.some(
    (item) => item.system?.usuwaForsowanie === true,
  );

  let flavor = maTelentBlokujacy ? "Forsowanie" : "Test";

  const { powiazaneTalenty: inneTalenty } =
    await targetActor.system.sprawdzTalenty("zrecznosc", []);
  const atrybutKey = "zrecznosc";
  const umiejkaKey = "zwinnosc";
  const atrybut = targetActor.system.atrybuty.zrecznosc.value;
  const umiejka = targetActor.system.atrybuty.zrecznosc.umiejetnosci.zwinnosc;
  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/wiedzmin_yze/templates/dialogs/uniki-dialog.hbs",
    { talenty: inneTalenty },
  );
  const uniki = await new Promise((resolve) => {
    new foundry.applications.api.DialogV2({
      window: { title: `Unikanie - ${targetActor.name}` },
      content: content,
      buttons: [
        {
          action: "paruj",
          label: "Unikaj",
          default: true,
          callback: async (_event, _button, dialog) => {
            const selection = dialog.element.querySelector(".typ-broni");

            const czymJestesAtakowny = selection.selectedOptions[0].dataset.typ;

            const bonus = Number(
              selection.selectedOptions[0].dataset.bonus || 0,
            );

            const modifier =
              parseInt(
                dialog.element.querySelector("input[name='inne-mody']")?.value,
              ) || 0;

            const checked = Array.from(
              dialog.element.querySelectorAll('input[name="stosuje"]:checked'),
            );

            const selectedItems = checked.map((input) => {
              const index = Number(input.dataset.id);
              return inneTalenty[index];
            });
            const unikaszOstrzalu =
              dialog.element.querySelector(".ostrzal").checked;
            const adrenalina = targetActor.system.adrenalina.value;

            const result = await globalThis.wiedzmin_yze.WiedzminRoll.unik({
              atrybutKey: atrybutKey,
              atrybut: atrybut,
              umiejetnoscKey: umiejkaKey,
              umiejetnosc: umiejka,
              adrenalina: adrenalina,
              czymJestesAtakowny: czymJestesAtakowny,
              bonus: bonus,
              modifier: modifier,
              messageID: message.id,
              flavor: flavor,
              type: "unik",
              unikaszOstrzalu: unikaszOstrzalu,
              wybranetalenty: selectedItems,
              actorUUID: targetActor.uuid,
            });

            resolve(result);
          },
        },
      ],
    }).render({ force: true });
  });

  await message.update({
    [`system.uniki.${targetActor.id}`]: uniki,
    [`system.extraSuccesses.${targetActor.id}`]:
      message.system.extraSuccesses - uniki,
  });
  let resultHTML = `<div class="parowanie-result">Unika ${uniki}</div>`;
  if (message.system.successes < uniki) {
    resultHTML = `<div class="parowanie-result">Unikną ataku</div>`;
    const zadajObr =
      event.target.parentElement.parentElement.parentElement.parentElement.querySelector(
        "button.zadaj-obrazenia",
      );
    zadajObr.disabled = true;
  }

  const button = event.target.parentElement.querySelector("button.parowanie");
  button.insertAdjacentHTML("afterend", resultHTML);
  let updatedContent = message.content.replace(
    /(<button[^>]*class="[^"]*parowanie[^"]*"[^>]*)(>[\s\S]*?<\/button>)/,
    `$1 disabled$2${resultHTML}`,
  );
  updatedContent = updatedContent.replace(
    /(<button[^>]*class="[^"]*unik[^"]*"[^>]*)(>[\s\S]*?<\/button>)/,
    `$1 disabled$2`,
  );
  if (message.system.successes < uniki) {
    updatedContent = updatedContent.replace(
      /(<button[^>]*class="[^"]*zadaj-obrazenia[^"]*"[^>]*)(>[\s\S]*?<\/button>)/,
      `$1 disabled$2`,
    );
  }

  await message.update({ content: updatedContent });
}
async function rzutObrazeniaCzar(event, message) {
  const data = message.system;
  if (!data) return;

  const actor = game.actors.get(data.actorID);
  if (!actor) return;

  const czar = data.czar;
  const dodatkoweObrazenia = await new Promise((resolve) => {
    if (data.extraSuccesses <= 0) {
      resolve(0);
      return;
    }
    const dialog = new foundry.applications.api.DialogV2({
      window: { title: `Dodatkowe obrażenia` },
      content: `
        <div class="form-group">
        <label> Dostene jest ${data.extraSuccesses} dodatkowych sukcesów. Czy chcesz je wykorzystać do zwiększenia obrażeń?</label>
        </div>
        <div class="form-group">
          <label for="extraSuccesses">Dodatkowe sukcesy:</label>
          <input type="number" name="extraSuccesses" id="extraSuccesses" value="0" max="${data.extraSuccesses}" min="0">
        </div>
      `,
      buttons: [
        {
          action: "confirm",
          label: "Potwierdź",
          default: true,
          callback: async (_event, _button, dialog) => {
            const extraSuccesses =
              parseInt(
                dialog.element.querySelector("input[name='extraSuccesses']")
                  .value,
              ) || 0;
            resolve(extraSuccesses);
          },
        },
      ],
    }).render({ force: true });
    dialog._onRender = function () {
      const input = dialog.element.querySelector(
        "input[name='extraSuccesses']",
      );
      const max = Number(input.max);
      input.addEventListener("change", function () {
        if (this.value > max) {
          this.value = max;
          ui.notifications.warn(
            `Nie możesz wykorzystać więcej niż ${max} dodatkowych sukcesów.`,
          );
        } else if (this.value < 0) {
          this.value = 0;
        }
      });
    };
  });
  const obrazenia =
    czar.system.obrazenia.podstawowe +
    dodatkoweObrazenia * czar.system.obrazenia.zaDodatkoweSuksecy;
  ChatMessage.create({
    speaker: { actor: actor.id },
    content: `Całkowite zadane obrażenia czarem ${czar.name}: ${obrazenia}.
      <br> Obrażenia z czaru (${czar.system.obrazenia.podstawowe})
      <br> Ze dodatkowe sukcesy (${dodatkoweObrazenia * czar.system.obrazenia.zaDodatkoweSuksecy})`,
  });
  event.target.disabled = true;
  const zadajObr =
    event.target.parentElement.parentElement.parentElement.parentElement.querySelector(
      "button.zadaj-obrazenia-czar",
    );
  zadajObr.disabled = true;
  message.update({ "system.zadanoObrazenia": true });
  const template = "systems/wiedzmin_yze/templates/chat/wiedzmin-czar.hbs";
  const content = await foundry.applications.handlebars.renderTemplate(
    template,
    message.system,
  );
  await message.update({ content }, { wiedzminUpdate: true });
}

async function zadajObrazeniaCzar(event, message) {
  const data = message.system;
  const messageCele = data.cel;
  const obrazenia = data.czar.system.obrazenia.podstawowe;
  const extraSuccesses = data.extraSuccesses;
  const context = {
    cel: messageCele,
    obrazenia: obrazenia,
    extraSuccesses: extraSuccesses,
  };
  const czar = data.czar;
  const template =
    "systems/wiedzmin_yze/templates/dialogs/wiedzmin-rozdanie-obrazen.hbs";
  const messageContent = await foundry.applications.handlebars.renderTemplate(
    template,
    context,
  );
  const dialog = new foundry.applications.api.DialogV2({
    window: { title: "Wiedzmin Roll" },
    content: messageContent,
    buttons: [
      {
        action: "confirm",
        label: "Potwierdź",
        default: true,
        callback: async (_event, _button, dialog) => {
          const cele = dialog.element.querySelectorAll(".target-token");
          const wydaneSukcesyInput = dialog.element.querySelector(
            "input[name='extraSuccesses']",
          );
          const wydaneSukcesy = Number(wydaneSukcesyInput?.value) || 0;
          const obrazenia =
            czar.system.obrazenia.podstawowe +
            wydaneSukcesy * czar.system.obrazenia.zaDodatkoweSuksecy;
          let content = `Zadano ${obrazenia} obrażeń czarem ${czar.name}.`;
          cele.forEach(async (cel) => {
            const targetID = cel.dataset.targetid;
            const input = Number(cel.querySelector("input").value) || 0;
            const targetToken = canvas.tokens.get(targetID);
            const tokenActor = targetToken.actor;
            const index = messageCele.findIndex((obj) => obj.id === targetID);
            const obrona = messageCele[index]?.obrona;
            let zddaneObrazenia = obrazenia;
            if (obrona >= extraSuccesses + 1) {
              content += `<br>Cel ${tokenActor.name} całkowicie uniknął obrażeń.`;
            } else {
              if (czar.system.obrona.typ === "unik") {
                content += `<br>Cel ${tokenActor.name} otrzymał ${obrazenia} obrażeń.`;
              } else if (czar.system.obrona.typ === "parowanie") {
                zddaneObrazenia = Math.max(0, obrazenia - obrona);
                content += `<br>Cel ${tokenActor.name} otrzymał ${zddaneObrazenia} obrażeń po parowaniu.`;
              }
              const obecneZycie = tokenActor.system.zycie.value;
              const noweZycie =
                obecneZycie - zddaneObrazenia < 0
                  ? 0
                  : obecneZycie - zddaneObrazenia;
              if (game.user.isGM) {
                await tokenActor.update({ "system.zycie.value": noweZycie });
              } else {
                const dataUpdate = {
                  actorId: tokenActor.id,
                  update: { "system.zycie.value": noweZycie },
                };
                game.socket.emit("system.wiedzmin_yze", {
                  type: "zadajObrazenia",
                  updateData: dataUpdate,
                });
              }
            }
          });
          ChatMessage.create({
            speaker: { actor: message.speaker.actor },
            content: content,
          });
          event.target.disabled = true;
          await message.update({ "system.zadanoObrazenia": true });
          const template2 =
            "systems/wiedzmin_yze/templates/chat/wiedzmin-czar.hbs";
          const messageContent =
            await foundry.applications.handlebars.renderTemplate(
              template2,
              message.system,
            );
          await message.update(
            { content: messageContent },
            { wiedzminUpdate: true },
          );
        },
      },
    ],
  });
  dialog.render({ force: true });
}
async function rzutObronnyCzar(event, message) {
  const target = event.target;
  const targetID = target.dataset.targetid;
  const obrona = target.dataset.obrona;
  const targetToken = canvas.tokens.get(targetID);
  if (!targetToken) return;

  const targetActor = targetToken.actor;
  if (!targetActor) return;
  const maTelentBlokujacy = targetActor.items.some(
    (item) => item.system?.usuwaForsowanie === true,
  );

  let flavor = maTelentBlokujacy ? "Forsowanie" : "Test";

  const { powiazaneTalenty: inneTalenty } =
    await targetActor.system.sprawdzTalenty(obrona, []);

  let atrybutKey = "";
  let umiejkaKey = "";
  switch (obrona) {
    case "unik":
      atrybutKey = "zrecznosc";
      umiejkaKey = "zwinnosc";
      break;
    case "wola":
      atrybutKey = "empatia";
      umiejkaKey = "wola";
      break;
    case "kondycja":
      atrybutKey = "sila";
      umiejkaKey = "krzepa";
      break;
  }
  const atrybut = targetActor.system.atrybuty?.[atrybutKey]?.value ?? 0;
  const umiejka =
    targetActor.system.atrybuty?.[atrybutKey]?.umiejetnosci?.[umiejkaKey] ?? 0;
  const adrenalina = targetActor.system.adrenalina.value;
  const secondArtibute = "";
  const hasSecondAttribute = false;
  const umiejkaLabel = game.i18n.localize(`wiedzmin.atrubut.${umiejkaKey}`);
  const atrubutLabel = game.i18n.localize(`wiedzmin.atrubut.${atrybutKey}`);
  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/wiedzmin_yze/templates/dialogs/wiedzmin-roll.hbs",
    {
      attribute: atrybut,
      skill: umiejka,
      adrenalina: adrenalina,
      item: inneTalenty,
      secondArtibute: secondArtibute,
      hasSecondAttribute: hasSecondAttribute,
      maTelentBlokujacy: maTelentBlokujacy,
      umiejkaLabel: umiejkaLabel,
    },
  );
  const obronaRzut = await new Promise((resolve) => {
    const dialog = new foundry.applications.api.DialogV2({
      window: { title: "Wiedzmin Roll" },
      content,
      buttons: [
        {
          action: "roll",
          label: "Roll",
          default: true,
          callback: async (_event, _button, dialog) => {
            const mod =
              Number(
                dialog.element.querySelector("input[name='modifier']").value,
              ) || 0;
            let attributeVal = atrybut;
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
            const basePool = attributeVal + umiejka + mod + talentBonus;
            const formula =
              adrenalina > 0
                ? `${basePool}dn + ${adrenalina}da`
                : `${basePool}dn`;
            let flavor = "Test";
            if (maTelentBlokujacy) {
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
                actorID: targetActor.id,
                umiejkaKey: umiejkaKey,
                atrybutKey: atrybutKeyUse,
                item: selectedItems,
                type: "roll",
                messageID: message.id,
              },
            );

            await roll.toMessage();
            resolve(roll);
          },
        },
      ],
    });

    dialog._onRender = function () {
      const input = dialog.element.querySelector("input[name='modifier']");
      const modyfikator = message.system.czar.system.obrona.modyfikator;
      input.value = modyfikator;
    };
    dialog.render({ force: true });
  });
  const maSukces = obronaRzut.isSuccess;
  let wynikObrony = -1;

  if (maSukces) {
    wynikObrony = obronaRzut.extraSuccesses + 1;
  }

  const index = message.system.cel.findIndex((obj) => obj.id === targetID);
  if (index !== -1) {
    const celArray = foundry.utils.deepClone(message.system.cel);

    celArray[index].obrona = wynikObrony;

    await message.update({
      "system.cel": celArray,
    });
  }

  const template = "systems/wiedzmin_yze/templates/chat/wiedzmin-czar.hbs";
  const messageContent = await foundry.applications.handlebars.renderTemplate(
    template,
    message.system,
  );
  await message.setFlag("wiedzmin_yze", "obronaCzar", true);
  await message.setFlag("wiedzmin_yze", "targetActor", {
    [targetActor.id]: targetID,
  });
  await message.update({ content: messageContent }, { wiedzminUpdate: true });
}

function mapTypToShape(typ) {
  switch (typ) {
    case "stozek":
      return "cone";
    case "linia":
      if (game.release.generation < 14) {
        return "ray";
      } else {
        return "line";
      }

    case "obszar":
      return "circle";
  }
}
async function stworzTemplate(event, message) {
  const data = message.system;
  const czar = data.czar;

  const typ = czar.system.cel.typ;
  const wielkosc = czar.system.cel.wartosc;

  const templateType = mapTypToShape(typ);

  const templateData = {
    t: templateType,
    user: game.user.id,
    x: 0,
    y: 0,
    direction: 0,
    distance: wielkosc,
    width: typ === "linia" ? 1 : undefined,
    angle: typ === "stozek" ? 90 : undefined,
    fillColor: game.user.color,
    czarName: czar.name,
    messageID: message.id,
  };

  startTemplatePreview(templateData);
  if (game.release.generation < 14) {
    event.target.disabled = true;
  }
}

async function startTemplatePreview(templateData) {
  let template;
  if (game.release.generation < 14) {
    const doc = new CONFIG.MeasuredTemplate.documentClass(templateData, {
      parent: canvas.scene,
    });

    template = new CONFIG.MeasuredTemplate.objectClass(doc);
    canvas.templates.preview.addChild(template);
  } else {
    const doc = new CONFIG.Region.documentClass(
      {
        flags: {
          wiedzmin_yze: {
            messageID: templateData.messageID,
          },
        },
        name: templateData.czarName,
        x: 100,
        y: 100,
        elevation: { bottom: 0, top: 100 },
        displayMeasurements: true,
        highlightMode: "coverage",
        visibility: 2,
        shapes: [
          {
            type: templateData.t,
            x: 0,
            y: 0,
            radius:
              templateData.distance * canvas.scene.dimensions.distancePixels,
            angle: templateData.angle,
            rotation: templateData.direction,
            width: 1 * canvas.scene.dimensions.distancePixels,
            length:
              templateData.distance * canvas.scene.dimensions.distancePixels,
          },
        ],
      },
      { parent: canvas.scene },
    );
    template = new CONFIG.Region.objectClass(doc);
    canvas.templates.preview.addChild(template);
  }
  await template.draw();

  let direction = 0;

  const moveHandler = (event) => {
    const pos = event.data.getLocalPosition(canvas.app.stage);

    const snapped = canvas.grid.getSnappedPoint(
      { x: pos.x, y: pos.y },
      { mode: CONST.GRID_SNAPPING_MODES.CENTER },
    );
    if (game.release.generation < 14) {
      template.document.updateSource({
        x: snapped.x,
        y: snapped.y,
      });
      template.refresh();
    } else {
      template.document.shapes[0].updateSource({
        x: snapped.x,
        y: snapped.y,
      });
      template._refreshMeasurements();
    }
  };

  const wheelHandler = (event) => {
    event.preventDefault();
    if (event.ctrlKey) {
      const delta = Math.sign(event.deltaY);
      direction += delta * 15;
      if (game.release.generation < 14) {
        template.document.updateSource({ direction });
        template.refresh();
      } else {
        template.document.shapes[0].updateSource({
          rotation: direction,
        });
        template._refreshMeasurements();
      }
    }
  };

  const clickHandler = async (event) => {
    event.preventDefault();
    cleanup();

    const data = template.document.toObject();

    if (game.release.generation < 14) {
      await canvas.scene.createEmbeddedDocuments("MeasuredTemplate", [data]);
    } else {
      const region = await canvas.scene.createEmbeddedDocuments("Region", [
        data,
      ]);
      const regionDoc = region[0];
      const message = game.messages.get(templateData.messageID);
      message.updateSource({
        "system.region": regionDoc.id,
      });
    }
  };

  const cancelHandler = (event) => {
    if (event.button === 2 && event.ctrlKey === false) {
      cleanup();
    }
  };

  function cleanup() {
    canvas.app.stage.off("mousemove", moveHandler);
    canvas.app.stage.off("mousedown", clickHandler);
    canvas.app.stage.off("rightdown", cancelHandler);
    window.removeEventListener("wheel", wheelHandler);

    template.destroy();
  }

  canvas.app.stage.on("mousemove", moveHandler);
  canvas.app.stage.on("mousedown", clickHandler);
  canvas.app.stage.on("rightdown", cancelHandler);
  window.addEventListener("wheel", wheelHandler, { passive: false });
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
