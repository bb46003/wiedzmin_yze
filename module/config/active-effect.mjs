/**
 * Rules-defined conditions in the format of {@link StatusEffectConfigMM3}.
 */
export const CONDITIONS = /** @type {const} */ ({
  glod: {
    type: "condition",
    name: "wiedzmin.glod",
    hud: { actorTypes: ["postac"] },
  },
  odwodnienie: {
    type: "condition",
    name: "wiedzmin.odwodnienie",
    hud: { actorTypes: ["postac"] },
  },
  zmeczenie: {
    type: "condition",
    name: "wiedzmin.zmeczenie",
    hud: { actorTypes: ["postac"] },
  },
  wychlodzenie: {
    type: "condition",
    name: "wiedzmin.wychlodzenie",
    hud: { actorTypes: ["postac"] },
  },
});
export const STATUS_EFFECTS = /** @type {const} */ ({
  dead: {
    id: "dead",
    name: "EFFECT.StatusDead",
    special: "DEFEATED",
    hud: { actorTypes: ["postac"] },
  },
});
