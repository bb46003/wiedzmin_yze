import { addHtmlEventListener } from "../utils.mjs";
import { WiedzminRoll } from "../roll/wiedzmin-roll.mjs";

export function addChatListeners(_app, html, _data) {
  addHtmlEventListener(html, "click", ".forsuj-button", forsujRzut, _app);
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

  // --- NOWA PULA ADRENALINY ---
  const oldAdrenalinaCount = adrenalinaRolls.length;
  const newAdrenalinaPool = oldAdrenalinaCount + 1;

  // zwiększamy poziom adrenaliny aktora
  await actor.system.zwiekszAdrenaline();

  // --- BUDOWANIE FORMUŁY ---
  let formula = "";

  if (newBasePool > 0) formula += `${newBasePool}d6`;

  if (newAdrenalinaPool > 0) {
    if (formula) formula += " + ";
    formula += `${newAdrenalinaPool}d6`;
  }

  const newRoll = new WiedzminRoll(
    formula,
    {},
    {
      adrenalina: newAdrenalinaPool,
      flavor: "Forsowanie",
      atrubutLabel: data.atrubutLabel,
      umiejkaLabel: data.umiejkaLabel,
      actorID: data.actorID,
      umiejkaKey: data.umiejkaKey,
      atrybutKey: data.atrybutKey,
    },
  );
  console.log(newRoll, data);
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
      newFormula: newFormula,
      oldsucesses: normalSuccesses + adrenalinaSuccesses,
    },
  );

  event.target.disabled = true;
}
