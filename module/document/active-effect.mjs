import { staticID } from "../utils.mjs";
import { postacActor } from "./actors/postac.mjs";

export class ActiveEffectWiedzmin_YZE extends foundry.documents.ActiveEffect {
  /**
   * Merge Foundry's status effects into the system's conditions where possible,
   * and set status effects to only contain the system's conditions.
   *
   * @see {@link CONFIG.statusEffects}
   * @see {@link wiedzmin_yze.config.CONDITIONS}
   */
  // TODO: Check implementation when preidcates are implemented; might not be needed if modifiers are enough?
  static applyEffects(document, effects) {
    const overrides = {};

    const statuses = new Set();

    const changes = effects
      .flatMap((effect) => {
        if (!effect.active) return [];
        for (const status of effect.statuses) statuses.add(status);
        const coreChanges = effect.changes.map((change) => ({
          effect,
          change,
        }));
        const systemChanges = effect.system.changes
          .filter((c) => c.type === "ae-like")
          .map((change) => ({
            effect,
            change,
          }));
        return coreChanges.concat(systemChanges);
      })
      .sort((a, b) => a.change.priority - b.change.priority);

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
  /** {@inheritDoc ActiveEffect#_fromStatusEffect} */
  static _fromStatusEffectSync(statusId, options = {}) {
    const status = CONFIG.statusEffects.find((e) => e.id === statusId);
    if (!status)
      throw new Error(
        `Invalid status ID "${statusId}" provided to ActiveEffect#fromStatusEffect`,
      );

    const cloned = foundry.utils.deepClone(status);

    const { id, label, icon, hud, type, ...raw } = cloned;

    const localizedName = game.i18n.localize(raw.name);

    const effectData = {
      name: localizedName,
      img: raw.img,
      statuses: Array.from(new Set([id, ...(raw.statuses ?? [])])),
      system: {
        name: localizedName,
        reference: raw.reference ?? null,
        supersededBy: raw.supersededBy ?? null,
        preventedActions: raw.preventedActions ?? [],
        conditions: raw.conditions ?? [],
      },
    };

    if (effectData.statuses.length > 1 && !status._id) {
      throw new Error(
        "Status effects with implicit statuses must have a static _id",
      );
    }

    return new ActiveEffectWiedzmin_YZE.implementation(effectData, options);
  }

  static _configureStatusEffects() {
    /**
     * A reducer function for transforming a system's condition into a status effect,
     * optionally registering it as a special status effect.
     *
     * @param {object[]} effects - The array of status effects.
     * @param {StatusEffectConfigMM3} data - The condition data.
     * @param {string} [special] - Whether the status effect is a special status effect.
     */
    const addEffect = (effects, { special, ...data }) => {
      data = foundry.utils.deepClone(data);
      data._id = staticID(`wyze${data.id}`);
      data.img ??= "icons/svg/cowled.svg";
      effects.push(data);
      if (special) CONFIG.specialStatusEffects[special] = data.id;
    };

    CONFIG.statusEffects = Object.entries(
      wiedzmin_yze.config.STATUS_EFFECTS,
    ).reduce((arr, [id, data]) => {
      const original = CONFIG.statusEffects.find((e) => e.id === id);
      addEffect(
        arr,
        foundry.utils.mergeObject(
          original ?? {},
          { id, ...data },
          { inplace: false },
        ),
      );
      return arr;
    }, []);
    for (const [id, data] of Object.entries(wiedzmin_yze.config.CONDITIONS)) {
      addEffect(CONFIG.statusEffects, { id, ...data });
    }
  }
  static async _preCreateOperation(documents, operation, user) {
    await super._preCreateOperation(documents, operation, user);

    if (!(operation.parent instanceof postacActor)) return;
    await wiedzmin_yze.models.Condition._preCreateConditions(
      documents,
      operation,
    );
  }

  /** {@inheritDoc ActiveEffect#_fromStatusEffect} */
  static _fromStatusEffectSync(statusId, options = {}) {
    const status = CONFIG.statusEffects.find((e) => e.id === statusId);
    if (!status)
      throw new Error(
        `Invalid status ID "${statusId}" provided to ActiveEffect#fromStatusEffect`,
      );
    const { id, label, icon, hud, ...effectData } =
      foundry.utils.deepClone(status);
    effectData.name = game.i18n.localize(effectData.name);
    effectData.statuses = Array.from(
      new Set([id, ...(effectData.statuses ?? [])]),
    );
    if (effectData.statuses.length > 1 && !status._id) {
      throw new Error(
        "Status effects with implicit statuses must have a static _id",
      );
    }
    return new ActiveEffectWiedzmin_YZE.implementation(effectData, options);
  }
}
