let Node = class {
	constructor() {
		this.position = [];
	}

	// https://stackoverflow.com/a/1249554
	getType() {
		return this.constructor.name;
	}

	setPos(leftPos, rightPos) {
		this.position[0] = leftPos;
		this.position[1] = rightPos;

		return this;
	}
}

module.exports = Node;