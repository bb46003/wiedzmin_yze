const BaseRuler = foundry.canvas.placeables?.tokens?.TokenRuler ?? class {};

export class WiedzminTokenRuler extends BaseRuler {
  static WAYPOINT_LABEL_TEMPLATE =
    "systems/wiedzmin_yze/templates/waypoint-label.hbs";

  static GRID_HIGHLIGHT_STYLES = {
    move: { color: 0x00604d },
    dash: { color: 0xaaaa00 },
    outOfRange: { color: 0xe83031 },
  };

  /** @override */
  _getWaypointLabelContext(waypoint, state) {
    const context = super._getWaypointLabelContext(waypoint, state);
    if (context?.cost?.units === "m") {
      const movement = this.token?.actor?.system.szybkosc.podstawa;
      const dash = this.token.actor.system.atrybuty.zrecznosc.value;
      const total = Number(context.cost.total);
      if (total > movement + dash) {
        context.rangeClass = "out-of-range";
      } else if (total <= movement) {
        context.rangeClass = "move-range";
      } else {
        context.rangeClass = "dash-range";
      }
    }
    return context;
  }

  /** @override */
  _getGridHighlightStyle(waypoint, offset) {
    if (!this.token.actor || waypoint.action === "blink") {
      return super._getGridHighlightStyle(waypoint, offset);
    }
    const movement = this.token.actor.system.szybkosc.podstawa;
    const dash = this.token.actor.system.atrybuty.zrecznosc.value;
    const cost = waypoint.measurement.cost;
    if (cost > movement + dash) {
      return WiedzminTokenRuler.GRID_HIGHLIGHT_STYLES.outOfRange;
    } else if (cost <= movement) {
      return WiedzminTokenRuler.GRID_HIGHLIGHT_STYLES.move;
    } else {
      return WiedzminTokenRuler.GRID_HIGHLIGHT_STYLES.dash;
    }
  }
}
