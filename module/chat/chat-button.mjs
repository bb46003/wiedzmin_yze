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
  addHtmlEventListener(html, "click", ".zadaj-obrazenia-czar", zadajObrazeniaCzar, _app);
  addHtmlEventListener(html, "click", ".rzut-obrazenia-czar", rzutObrazeniaCzar, _app);


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
      iloscPrzerzuconych: `${newBasePool}d6`,
      newFormula: newFormula,
      oldsucesses: normalSuccesses + adrenalinaSuccesses,
    },
  );

  event.target.disabled = true;
  if (data.messageID) {
    const oryginalMessage = game.messages.get(data.messageID);
    if (!oryginalMessage) return;

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
    console.log(czar);
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
  const bron = actor.items.get(bronId);
  const obrazenia = bron.system.obrazenia;
  const telenty = data.item;
  let modifikatorObrazen = 0;
  for (const uuid of telenty) {
    const item = await fromUuid(uuid.uuid);
    if (item.system?.modifikatorObrazen) {
      modifikatorObrazen += item.system.zwiekszoneObrazenia;
    }
  }
  const dodatkoweObrazenia = await Promise(resolve => {
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
            const extraSuccesses = parseInt(dialog.element.querySelector("input[name='extraSuccesses']").value) || 0;
            resolve(extraSuccesses);
          },
        },
      ],
    }).render({ force: true });
  });
  const wyparowanoObrazen = data?.wyparowane || 0;
  const calkowiteObrazenia =
    obrazenia + modifikatorObrazen + data.bonusDoObrazen + dodatkoweObrazenia;

  const zadaneObrzenia =
    calkowiteObrazenia - wyparowanoObrazen < 0
      ? 0
      : calkowiteObrazenia - wyparowanoObrazen;

  const zadaneObrazenia = [];

  if (cel.length > 0) {
    await Promise.all(
      cel.map(async (target) => {
        const celToken = canvas.tokens.get(target.id);
        const celActor = celToken.actor;
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

        await celActor.update({
          "system.zycie.value": noweZycie < 0 ? 0 : noweZycie,
        });

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
  const bron = actor.items.get(bronId);
  const obrazenia = bron.system.obrazenia;
  const telenty = data.item;
  let modifikatorObrazen = 0;
  for (const uuid of telenty) {
    const item = await fromUuid(uuid.uuid);
    if (item.system?.modifikatorObrazen) {
      modifikatorObrazen += item.system.zwiekszoneObrazenia;
    }
  }
  const dodatkoweObrazenia = await Promise(resolve => {
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
            const extraSuccesses = parseInt(dialog.element.querySelector("input[name='extraSuccesses']").value) || 0;
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

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/wiedzmin_yze/templates/dialogs/parowanie-dialog.hbs",
    { czymParujesz: czymParujesz, talenty: inneTalenty },
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
    "system.uniki": uniki,
    "system.extraSuccesses": message.system.extraSuccesses - uniki,
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
async function zadajObrazeniaCzar(event, message) {
  const data = message.system;
  if (!data) return;

  const actor = game.actors.get(data.actorID);
  if (!actor) return;
  const cel = data.cel;
  const czarId = data.czarId;
  const czar = actor.items.get(czarId);
   const dodatkoweObrazenia = await Promise(resolve => {
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
            const extraSuccesses = parseInt(dialog.element.querySelector("input[name='extraSuccesses']").value) || 0;
            resolve(extraSuccesses);
          },
        },
      ],
    }).render({ force: true });
  });
}

function mapTypToShape(typ) {
  switch (typ) {
    case "stozek":
      return "cone";
    case "linia":
      if(game.release.generation < 14){
        return "ray";
      }else{
        return "line"
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
            width: 1*canvas.scene.dimensions.distancePixels,
            length: templateData.distance * canvas.scene.dimensions.distancePixels,

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
      template.renderFlags.set({
        refreshMeasurements: true,
      });
    }
  };


  const wheelHandler = (event) => {
    event.preventDefault();
    if(event.ctrlKey){
    const delta = Math.sign(event.deltaY);
    direction += delta * 15; 
    if (game.release.generation < 14) {
      template.document.updateSource({ direction });
      template.refresh();
    } else {
      template.document.shapes[0].updateSource({
        rotation: direction,
      });
      template.renderFlags.set({
        refreshMeasurements: true,
      });
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
