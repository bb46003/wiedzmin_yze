import { staticID } from "../utils.mjs";
import { postacActor } from "./actors/postac.mjs";

export class ActiveEffectWiedzmin_YZE extends foundry.documents.ActiveEffect {

  /**
   * Apply both core and system-specific changes
   */
  static applyEffects(document, effects) {
    const overrides = {};
    const statuses = new Set();

    const changes = effects
      .flatMap((effect) => {
        if (!effect.active) return [];

        for (const status of effect.statuses) statuses.add(status);

        // ✅ core changes (always safe)
        const coreChanges = (effect.changes ?? []).map((change) => ({
          effect,
          change,
        }));

        // ✅ system changes (safe access)
        const systemChanges = (effect.system?.changes ?? [])
          .filter((c) => c.type === "ae-like")
          .map((change) => ({
            effect,
            change,
          }));

        return coreChanges.concat(systemChanges);
      })
      .sort((a, b) => (a.change.priority ?? 0) - (b.change.priority ?? 0));

    for (const change of changes) {
      const appliedChanges = change.effect.apply(document, change.change);
      Object.assign(overrides, appliedChanges);
    }

    document.overrides = foundry.utils.expandObject({
      ...foundry.utils.flattenObject(document.overrides),
      ...overrides,
    });

    return statuses;
  }

  /**
   * Create ActiveEffect from status effect
   */
  static _fromStatusEffectSync(statusId, options = {}) {
    const status = CONFIG.statusEffects.find((e) => e.id === statusId);

    if (!status) {
      throw new Error(
        `Invalid status ID "${statusId}" provided to ActiveEffect#fromStatusEffect`
      );
    }

    const cloned = foundry.utils.deepClone(status);
    const { id, ...raw } = cloned;

    const localizedName = game.i18n.localize(raw.name);

    const effectData = {
      name: localizedName,
      img: raw.img,
      statuses: Array.from(new Set([id, ...(raw.statuses ?? [])])),

      // ✅ REQUIRED by Foundry
      changes: raw.changes ?? [],

      // ✅ your system data
      system: {
        name: localizedName,
        reference: raw.reference ?? null,
        supersededBy: raw.supersededBy ?? null,
        preventedActions: raw.preventedActions ?? [],
        conditions: raw.conditions ?? [],
        changes: raw.system?.changes ?? [], // ✅ critical fix
      },
    };

    if (effectData.statuses.length > 1 && !status._id) {
      throw new Error(
        "Status effects with implicit statuses must have a static _id"
      );
    }

    return new ActiveEffectWiedzmin_YZE.implementation(effectData, options);
  }

  /**
   * Configure CONFIG.statusEffects
   */
  static _configureStatusEffects() {
    const addEffect = (effects, { special, ...data }) => {
      data = foundry.utils.deepClone(data);

      // ✅ ensure compatibility
      data.changes ??= [];
      data.system ??= {};
      data.system.changes ??= [];

      data._id = staticID(`wyze${data.id}`);
      data.img ??= "icons/svg/cowled.svg";

      // remove existing
      const existingIndex = effects.findIndex((e) => e.id === data.id);
      if (existingIndex !== -1) effects.splice(existingIndex, 1);

      effects.push(data);

      if (special) CONFIG.specialStatusEffects[special] = data.id;
    };

    // ✅ start from original effects
    const effects = CONFIG.statusEffects.map((e) =>
      foundry.utils.deepClone(e)
    );

    // ✅ override / extend STATUS_EFFECTS
    for (const [id, data] of Object.entries(
      wiedzmin_yze.config.STATUS_EFFECTS
    )) {
      const original = effects.find((e) => e.id === id);

const merged = foundry.utils.mergeObject(
  foundry.utils.deepClone(original ?? {}),
  {
    id,
    ...data,
    system: foundry.utils.mergeObject(
      original?.system ?? {},
      data.system ?? {},
      { inplace: false },
    ),
  },
  { inplace: false }
);

effects.forEach(effect =>{
if(!effect.changes){
  effect.changes = []
}
})

      addEffect(effects, merged);
    }

    // ✅ add CONDITIONS
    for (const [id, data] of Object.entries(
      wiedzmin_yze.config.CONDITIONS
    )) {
      addEffect(effects, { id, ...data });
    }

    CONFIG.statusEffects = effects;
  }

  /**
   * Hook into creation
   */
  static async _preCreateOperation(documents, operation, user) {
    await super._preCreateOperation(documents, operation, user);

    if (!(operation.parent instanceof postacActor)) return;

    await wiedzmin_yze.models.Condition._preCreateConditions(
      documents,
      operation
    );
  }
}