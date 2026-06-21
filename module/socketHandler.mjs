export class SocketHandler {
  constructor() {
    this.identifier = "system.wiedzmin_yze";
    this.registerSocketEvents();
  }
  registerSocketEvents() {
    game.socket.on("system.wiedzmin_yze", async (data) => {
      switch (data.type) {
        case "zadajObrazenia": {
          if (game.user.isGM) {
            const targetActor = await game.actors.get(data.updateData.actorId);
            const updateData = data.updateData.update;
            await targetActor.update(updateData);
            break;
          }
        }
      }
    });
  }
}
