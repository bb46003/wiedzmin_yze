import { ActiveEffectWiedzmin_YZE } from "../document/active-effect.mjs";

const { SetField, StringField, NumberField } = foundry.data.fields;

export class Condition extends foundry.abstract.TypeDataModel {
  static metadata = Object.freeze({});
  /** @override */
  static defineSchema() {
    return {
      targets: new SetField(new StringField({ blank: true }), {
        label: "wiedzmin.CONDITION.Targets",
        hint: "wiedzmin.CONDITION.TargetsHint",
      }),
      value: new NumberField({ required: true, initial: 0, integer: true }),
    };
  }

  /**
   * Handle {@link ActiveEffect._preCreateOperation} calls to add child conditions from combined conditions.
   *
   * @param {ActiveEffectMM3[]} documents - The documents being created.
   * @param {foundry.abstract.types.DatabaseCreateOperation} operation - The operation being performed.
   * @returns {Promise<void>}
   */
  static async _preCreateConditions(documents, operation) {
    // Add child conditions from combined conditions
    const additionalEffects = new foundry.utils.Collection();

    /**
     * Add a combined condition's constituent conditions to the {@link additionalEffects} collection.
     *
     * @param {ConditionId} condition - The combined condition to add.
     * @param {ActiveEffectMM3} parent - The parent effect to add the child conditions to.
     * @param {number} [depth=0] - The current depth of recursion.
     * @returns {Promise<void>}
     */
    const addConstituentConditions = async (condition, parent, depth = 0) => {
      depth += 1;
      if (depth > 5) {
        console.error(
          new Error(
            `Maximum depth reached while adding constituent conditions for ${condition}`,
          ),
        );
        return;
      }

      const statusEffect = CONFIG.statusEffects.find((s) => s.id === condition);
      // Skip handling existing conditions
      if (operation.parent.effects.has(statusEffect._id)) return;

      const addedEffect = additionalEffects.get(condition);
      if (addedEffect) {
        addedEffect.updateSource({ origin: parent._id });
      } else {
        const effect =
          await ActiveEffectWiedzmin_YZE.implementation.fromStatusEffect(
            condition,
          );
        effect.updateSource({ origin: parent._id });
        additionalEffects.set(condition, effect);
        for (const c of statusEffect.conditions ?? [])
          await addConstituentConditions(c, effect, depth);
      }
    };

    for (const doc of documents) {
      for (const status of [...doc.statuses]) {
        const conditions =
          CONFIG.statusEffects.find((s) => s.id === status).conditions ?? [];
        for (const condition of conditions) {
          await addConstituentConditions(condition, doc);
        }
      }
    }
    for (const effect of additionalEffects) documents.push(effect);
  }

  /**
   * Handle {@link ActiveEffect._preDeleteOperation} calls to remove child conditions when their combined condition parent is deleted,
   * and remove combined conditions that no longer have any component conditions.
   *
   * @param {ActiveEffectMM3[]} documents - The documents being deleted.
   * @param {foundry.abstract.types.DatabaseDeleteOperation} operation - The operation being performed.
   * @returns {Promise<void>}
   */
  static async _preDeleteConditions(documents, operation) {
    const clearableConditions = new Set();

    /**
     * Add component conditions to delete operation if combined condition is deleted.
     *
     * @param {ActiveEffectMM3} effect - The combined condition effect to add component conditions for.
     * @param {number} [depth=0] - The current depth of recursion.
     * @returns {void}
     */
    const addClearableConditions = (effect, depth = 0) => {
      depth += 1;
      if (depth > 5) {
        console.error(
          new Error(
            `Maximum depth reached while adding clearable conditions for ${effect}`,
          ),
        );
        return;
      }
      // Map condition IDs to their document IDs, inefficiently using CONFIG to ensure correctness
      const docIds = (
        CONFIG.statusEffects.find((s) => s._id === effect.id)?.conditions ?? []
      )
        .map((id) => CONFIG.statusEffects.find((s) => s.id === id))
        .map((s) => s._id);
      for (const docId of docIds) {
        const conditionEffect = operation.parent.effects.get(docId);
        if (conditionEffect && conditionEffect.origin === effect.id) {
          clearableConditions.add(conditionEffect.id);
          // Recusively add child conditions
          addClearableConditions(conditionEffect, depth);
        }
      }
    };

    // Add component conditions to delete operation if combined condition is deleted
    for (const doc of documents) {
      addClearableConditions(doc);
    }

    // Add combined conditions whose component status effects are no longer provided by any effect
    const remainingEffects = operation.parent.effects.filter(
      (e) => !operation.ids.includes(e.id) || clearableConditions.has(e.id),
    );
    const remainingStatuses = new Set(
      remainingEffects.flatMap((e) => [...e.statuses]),
    );
    const combinedConditions = CONFIG.statusEffects.filter(
      (eff) => "conditions" in eff && eff.conditions.length > 0,
    );
    for (const condition of combinedConditions) {
      if (!operation.parent.effects.has(condition._id)) continue; // Ignore combined conditions not present on actor
      const hasRemainingComponent = condition.conditions.some((c) =>
        remainingStatuses.has(c),
      );
      if (!hasRemainingComponent) clearableConditions.add(condition._id);
    }

    // Add deletable conditions
    operation.ids.push(...[...clearableConditions]);
  }
}
