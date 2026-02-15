export class postacActor extends foundry.documents.Actor {
  /** @override */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (this.type === "postac") {
      await this.updateSource({
        "prototypeToken.actorLink": true,
      });
    }
  }
}
