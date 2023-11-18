let Token = require("./token.js");

let Lexer = class {
	constructor(code) {
		this.code = code;
		this.pos = -1;
	}

	advance(delta = 1) {
		this.pos += delta;
	}

	at() {
		return this.code[this.pos];
	}

	notEOF() {
		return this.pos < this.code.length;
	}

	lexerize() {
		let tokens = [];

		while (this.notEOF()) {
			if (("+-*/%").includes(this.at())) {
				tokens.push( new Token("operator", this.at()) );
			}

			this.advance();
		}

		return tokens;
	}
}

module.exports = Lexer;