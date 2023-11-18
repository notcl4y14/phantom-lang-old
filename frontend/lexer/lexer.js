let Token = require("./token.js");
let Error = require("../error.js");
let Position = require("../position.js");

let lexer_error = function(value) {
	console.error(`lexer error: ${value}`);
	process.exit();
}

let lexer_TokenTypes = [
	{
		type: "whitespace",
		find: " \t\r\n",
		ignore: true
	},
	{
		type: "operator",
		find: "+-*/%",
		one_char: true
	},
	{
		type: "number",
		find: "1234567890",
		one_char: false,
		lexerize: function(lexer) {
			let numStr = "";
			let float = false;

			while (lexer.notEOF() && ("1234567890.").includes(lexer.at())) {

				if (lexer.at() == ".") {
					if (float) break;
					numStr += ".";
					float = true;

				} else {
					numStr += lexer.at();
				}

				lexer.advance();
			}

			lexer.advance(-1);

			return new Token(this.type, Number(numStr));
		}
	}
]

let lexer_Result = class {
	constructor() {
		this.token = null;
		this.error = null;
	}

	register(res) {
		if (res.error)
			return res;

		return res.token;
	}

	success(token) {
		this.token = token;
		return this;
	}

	failure(error) {
		this.error = error;
		return this;
	}
}

let Lexer = class {
	constructor(filename, code) {
		this.filename = filename;
		this.code = code;
		this.pos = new Position(-1, 0, -1);

		this.advance();
	}

	advance(delta = 1) {
		this.pos.advance(this.at(), delta);
	}

	at() {
		return this.code[this.pos.index];
	}

	notEOF() {
		return this.pos.index < this.code.length;
	}

	lexerize() {
		let res = new lexer_Result();
		let tokens = [];

		while (this.notEOF()) {

			// Initializing a variable for checking errors
			let tokenFound = false;

			for (let i = 0; i < lexer_TokenTypes.length; i += 1) {
				// Instance
				let tokenType = lexer_TokenTypes[i];

				if (tokenType.find.includes(this.at())) {

					// Ignorable token
					if (tokenType.ignore) {
						tokenFound = true;
						break;

					// One-character token
					} else if (tokenType.one_char) {
						// Pushing
						tokens.push( new Token(tokenType.type, this.at()) );
						tokenFound = true;
						break;

					// Multi-character token
					} else if (tokenType.lexerize) {
						let token = tokenType.lexerize(this);
						if (!token) lexer_error(`Token Type's lexerize() method should return a Token`);

						// Pushing
						tokens.push(token);
						tokenFound = true;
						break;
					}

					lexer_error(`Token type '${tokenType.type}' should have the lexerize() method unless 'one_char' is set to true`);
				}
			}

			// "Undefined Token" error
			if (!tokenFound)
				return res.failure(new Error(this.filename, this.pos.clone(), `Undefined token '${this.at()}'`));

			// Advancing to the next character
			this.advance();
		}

		tokens.push( new Token("EOF") );

		return res.success(tokens);
	}
}

module.exports = Lexer;