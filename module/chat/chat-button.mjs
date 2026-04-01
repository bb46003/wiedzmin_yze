import { addHtmlEventListener } from "../utils.mjs";
import { WiedzminRoll } from "../roll/wiedzmin-roll.mjs";

export function addChatListeners(_app, html, _data) {
  addHtmlEventListener(html, "click", ".forsuj-button", forsujRzut, _app);
  addHtmlEventListener(html, "click", ".openTalenet", otworzTalent, _app);
  addHtmlEventListener(html, "click", ".zaczerpMoc-button", zaczerpMoc, _app);
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
      type:data.type,
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
  newRoll._adrenalinaTerm.results.sort((a, b) => b.result - a.result);
  newRoll._normalTerm.results.sort((a, b) => b.result - a.result);
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
}
async function otworzTalent(ev) {
  const target = ev.target;
  const item = await fromUuid(target.dataset.itemid);
  const itemName = item.name;
  const opis = item.system.opis;
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
async function zaczerpMoc(event, message) {
  const data = message.system;
  console.log(data);
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
    const mocZOgnia = zrodlo === "ogien" ? 2 * mocZaczerpnieta : mocZaczerpnieta;
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
