export class Wiedzmin_YZE_Dice extends foundry.dice.terms.Die {
	constructor(termData) {
		termData.faces = 6;
		super(termData);
	}

	/* -------------------------------------------- */

	/** @override */
	static DENOMINATION = "n";


	/* -------------------------------------------- */

	/** @override */
	getResultLabel(result) {
		return {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 6,
		}[result.result];
	}

	static values = {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
		6: 6,
	};

	get total() {
		if (!this._evaluated) {
			return null;
		}
		return this.results.reduce((t, r) => {
			if (!r.active) {
				return t;
			}
			if (r.count !== undefined) {
				return t + r.count;
			}
			return t + Wiedzmin_YZE_Dice.getValue(r.result);
		}, 0);
	}

	/** @override */
	roll(options) {
		const roll = super.roll(options);
		roll.effect = roll.result === 5 || roll.result === 6;
		return roll;
	}

	get resultValues() {
		return this.results.map(result => {
			return Wiedzmin_YZE_Dice.getResultLabel(result.result);
		});
	}

	static getValue(dieSide) {
		// 1 if Effect, otherwise take the value
		return Wiedzmin_YZE_Dice.values[dieSide]

	}
}
export class Wiedzmin_YZE_Adrenalina_Dice extends foundry.dice.terms.Die {
	constructor(termData) {
		termData.faces = 6;
		super(termData);
	}

	/* -------------------------------------------- */

	/** @override */
	static DENOMINATION = "a";


	/* -------------------------------------------- */

	/** @override */
	getResultLabel(result) {
		return {
			1: 1,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
			6: 6,
		}[result.result];
	}

	static values = {
		1: 1,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
		6: 6,
	};

	get total() {
		if (!this._evaluated) {
			return null;
		}
		return this.results.reduce((t, r) => {
			if (!r.active) {
				return t;
			}
			if (r.count !== undefined) {
				return t + r.count;
			}
			return t + Wiedzmin_YZE_Dice.getValue(r.result);
		}, 0);
	}

	/** @override */
	roll(options) {
		const roll = super.roll(options);
		roll.effect = roll.result === 5 || roll.result === 6;
		return roll;
	}

	get resultValues() {
		return this.results.map(result => {
			return Wiedzmin_YZE_Dice.getResultLabel(result.result);
		});
	}

	static getValue(dieSide) {
		// 1 if Effect, otherwise take the value
		return Wiedzmin_YZE_Dice.values[dieSide]

	}
}
