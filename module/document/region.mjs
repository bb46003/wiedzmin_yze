export class WiedzminRegionDocument extends CONFIG.Region.documentClass {
  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);

    const messageID = this.flags?.wiedzmin_yze?.messageID;
    if (!messageID) return;

    Hooks.once("drawRegion", async (regionObj) => {
      if (regionObj.document.id !== this.id) return;

      await this._updateMessageTargets(regionObj, messageID);
    });
  }

  async _onUpdate(data, options, userId) {
    await super._onUpdate(data, options, userId);

    if (options?.wiedzminUpdate) return;

    const messageID = this.flags?.wiedzmin_yze?.messageID;
    if (!messageID) return;

    const regionObj = canvas.regions.get(this.id);
    if (!regionObj) return;

    await this._updateMessageTargets(regionObj, messageID);
  }

  /* -------------------------------------------- */

  async _updateMessageTargets(regionObj, messageID) {
    // ⚠️ IMPORTANT: wait one frame for token detection
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const tokens = Array.from(regionObj.document.tokens).map((t) => ({
      id: t.id,
      img: t.texture.src,
      name: t.name,
    }));
    const message = game.messages.get(messageID);
    if (!message) return;
    const actor = game.actors.get(message.system.actorID);
    const czar = actor.items.get(message.system.czar._id);

    await message.update(
      {
        "system.cel": tokens,
        "system.region": this.id,
        "system.czar": {
          uuid: czar._uuid,
          name: czar.name,
          system: czar.system,
        },
        "system.uzytoRegion": true,
      },
      { wiedzminUpdate: true },
    );
    const template = "systems/wiedzmin_yze/templates/chat/wiedzmin-czar.hbs";
    const content = await foundry.applications.handlebars.renderTemplate(
      template,
      message.system,
    );
    await message.update({ content }, { wiedzminUpdate: true });
  }
}
