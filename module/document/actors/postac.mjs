export class postacActor extends foundry.documents.Actor {
  /** @override */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (this.type === "postac") {
      await this.updateSource({
        "prototypeToken.actorLink": true,
        "prototypeToken.bar1.attribute": "zycie",
        "prototypeToken.bar2.attribute": "adrenalina",
        "prototypeToken.displayBars": 10, // Hovered by Anyone
        "prototypeToken.sight.enabled": true, // Vision enabled
        "prototypeToken.disposition": 1, // Friendly
      });
    }
  }
}
