let rfr = require("rfr");
let Colors = rfr("utils/colors.js");

let Token = class {
	static Type = {
		// values
		Number: "Number",
		String: "String",
		Identifier: "Identifier",
		Keyword: "Keyword",

		Comment: "Comment",

		// operators
		Plus: "Plus",
		Minus: "Minus",
		Mult: "Mult",
		Div: "Div",
		Mod: "Mod",

		Less: "Less",
		Greater: "Greater",
		LessEq: "LessEq",
		GreaterEq: "GreaterEq",

		IsEqual: "IsEqual",
		NotEqual: "NotEqual",

		PlusEq: "PlusEq",
		MinusEq: "MinusEq",
		MultEq: "MultEq",
		DivEq: "DivEq",
		ModEq: "ModEq",

		And: "And",
		Or: "Or",
		Not: "Not",

		Equals: "Equals",

		// closures
		LeftParen: "LeftParen",
		RightParen: "RightParen",
		LeftBracket: "LeftBracket",
		RightBracket: "RightBracket",
		LeftBrace: "LeftBrace",
		RightBrace: "RightBrace",

		// symbols
		Ampersand: "Ampersand",
		Pipe: "Pipe",
		Dot: "Dot",
		Comma: "Comma",
		Colon: "Colon",
		Semicolon: "Semicolon",

		// misc.
		EOF: "EOF",
	};

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
		this.rightPos = (rightPos || leftPos.clone().advance());

		return this;
	}

	// Checks if the token type and value match the given ones
	matches(type, value) {
		return this.type == type
			&& this.value == value;
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