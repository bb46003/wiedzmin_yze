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
  async rollInitiative() {
    //dla potworów przeba będzie likla wywołan inicjatywy zrobić

    const jestWalka = game.combats?.active?.combatants.find(
      (actor) => actor.actorId === this.id,
    );
    if (jestWalka) {
      return super.rollInitiative();
    } else {
      ui.notifications.warn(
        "Nie ma aktywnej Walki i nie możesz rzucić na Inicjatywę",
      );
    }
  }
  async _onUpdate(data, options, user) {
    const changeName = data?.name ?? false;
    if (changeName && this.type === "postac") {
      const tokenName = data.name;
      const actor = this;
      await actor.prototypeToken.update({ name: tokenName });
      const dependedTokens = actor.getDependentTokens();
      for (const scene of dependedTokens) {
        for (const token of scene[0].tokens) {
          if (token.actorId === actor.id) {
            await token.update({ name: tokenName });
          }
        }
      }
    }
    const tokenImg = data?.prototypeToken?.texture?.src ?? false;
    if (tokenImg && this.type === "postac") {
      const tokenImg = data.prototypeToken.texture.src;
      const actor = this;
      const dependedTokens = actor.getDependentTokens();
      for (const token of dependedTokens) {
        await token.update({ ["texture.src"]: tokenImg });
      }
    }
  }
}
