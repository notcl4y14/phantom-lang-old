let rfr = require("rfr");
let Colors = rfr("utils/colors.js");

let Position = class {
	constructor(index, line, column) {
		this.index = index;
		this.line = line;
		this.column = column;
	}

	// Advance the index and column. Advances the line too if the char is "\n"
	advance(char, delta = 1) {
		this.index += delta;
		this.column += delta;

		if (char == "\n") {
			this.column = 0;
			this.line += 1;
		}

		return this;
	}

	// Returns the Position as string
	asString() {
		let	index	= this.index,
			line	= this.line,
			column	= this.column;

		return `[ ${Colors.FgYellow}${index}${Colors.Reset}, ${Colors.FgYellow}${line}${Colors.Reset}:${Colors.FgYellow}${column}${Colors.Reset} ]`;
	}

	// Returns the new Position class with the same properties
	clone() {
		return new Position(this.index, this.line, this.column);
	}
}

module.exports = Position;