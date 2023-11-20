let Colors = require("../../utils/colors.js");

let Token = class {
	constructor(type, value) {
		this.type = type;
		this.value = value;

		this.leftPos = null;
		this.rightPos = null;
	}

	// Sets the leftPos and rightPos, returning this
	// Which gives the ability to create a token with the set positions
	setPos(leftPos, rightPos) {
		this.leftPos = leftPos;
		this.rightPos = (rightPos || leftPos.clone());

		return this;
	}

	// Checks if the token type and value match the given ones
	matches(type, value) {
		return
			(this.type == type
			&& this.value == value);
	}

	// Returns the Token as string
	asString() {
		let	type		= this.type,
			value		= this.value,
			leftPos		= (this.leftPos) ? this.leftPos.asString() : this.leftPos,
			rightPos	= (this.rightPos) ? this.rightPos.asString() : this.rightPos;

		return `[ Type: ${Colors.FgGreen}'${type}'${Colors.Reset},	Value: ${Colors.FgGreen}'${value}'${Colors.Reset},		leftPos: ${leftPos},	rightPos: ${rightPos} ]`;
	}
}

module.exports = Token;