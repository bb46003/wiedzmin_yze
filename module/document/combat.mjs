export class wiedzmin_yze_Combar extends Combat{
async rollInitiative(ids, {formula=null, updateTurn=true, messageMode, messageOptions={}}={}) {

    // Structure input data
    ids = typeof ids === "string" ? [ids] : ids;
    if ( "rollMode" in messageOptions ) {
      foundry.utils.logCompatibilityWarning("The rollMode option of Combat#rollInitiative messageOptions is"
        + " deprecated in favor of the `messageMode` option, a string key of CONFIG.ChatMessage.modes",
      {since: 14, until: 16});
      messageMode = foundry.dice.Roll._mapLegacyRollMode(messageOptions.rollMode);
      delete messageOptions.rollMode;
    }

    // Iterate over Combatants, performing an initiative roll for each
    const updates = [];
    const messages = [];
    for ( const [i, id] of ids.entries() ) {

      // Get Combatant data (non-strictly)
      const combatant = this.combatants.get(id);
      if ( !combatant?.isOwner ) continue;

      // Produce an initiative roll for the Combatant
      const roll = combatant.getInitiativeRoll(formula);
      await roll.evaluate();
      updates.push({_id: id, initiative: roll.total});

      // Construct chat message data
      const messageData = foundry.utils.mergeObject({
        speaker: foundry.documents.ChatMessage.implementation.getSpeaker({
          actor: combatant.actor,
          token: combatant.token,
          alias: combatant.name
        }),
        flavor: "Rzut na inicjatywę przez " + foundry.utils.escapeHTML(combatant.name),
        flags: { "core.initiativeRoll": true }
      }, messageOptions);
      const chatData = await roll.toMessage(messageData, {
        messageMode: messageMode ?? (combatant.hidden ? "gm" : undefined), // Private rolls for hidden combatants
        create: false
      });
      if ( i > 0 ) chatData.sound = null; // Only 1 sound for whole rolled set
      messages.push(chatData);
    }
    if ( !updates.length ) return this;

    // Update combatants and combat turn
    const updateOptions = {turnEvents: false};
    if ( !updateTurn ) updateOptions.combatTurn = this.turn;
    await this.updateEmbeddedDocuments("Combatant", updates, updateOptions);

    // Create multiple chat messages
    await foundry.documents.ChatMessage.implementation.create(messages);
    return this;
  }

}