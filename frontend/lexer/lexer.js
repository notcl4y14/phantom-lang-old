let Token = require("./token.js");
let Error = require("../error.js");
let Position = require("../position.js");

// Token types that are used in lexer to search tokens
let lexerTokenTypes = require("../../assets/lexer/token-types.js");

// Outputs the lexer error and exits the program
let lexerError = function(value) {
	console.error(`lexer error: ${value}`);
	process.exit();
}

let lexerResult = class {
	constructor() {
		this.list = null;
		this.error = null;
	}

	success(list) {
		this.list = list;
		return this;
	}

	failure(filename, position, details) {
		this.error = new Error(filename, position, details);
		return this;
	}
}

let Lexer = class {
	constructor(filename, code) {
		this.filename = filename;
		this.code = code;
		this.position = new Position(-1, 0, -1);

		this.advance();
	}

	// Advances to the next character
	advance(delta = 1) {
		this.position.advance(this.at(), delta);
	}

	// Returns the current character
	at(range = 1) {
		return this.code.substr(this.position.index, range);
	}

	// Checks if the lexer is not at the end of file
	notEOF() {
		return this.position.index < this.code.length;
	}

	// Makes tokens
	lexerize() {
		let res = new lexerResult();
		let listTokens = [];

		while (this.notEOF()) {

			// Initializing a variable for checking errors
			let isTokenFound = false;

			// Iterating through the lexer token types
			for (let i = 0; i < lexerTokenTypes.length; i += 1) {

				// Instance
				let tokenType = lexerTokenTypes[i];

				// The "find" property length
				let length = 1;

				if (tokenType.flags.includes("multi-char"))
					length = tokenType.find.length;

				// Checking if the `find` property matches the current character
				if (tokenType.find.includes(this.at(length))) {

					// Ignorable token
					if (tokenType.flags.includes("ignore")) {
						isTokenFound = true;
						break;

					// One-character token
					} else if (tokenType.flags.includes("one-char")) {
						// Pushing
						listTokens.push( new Token(tokenType.type, this.at())
							.setPos(this.position.clone()) );
						isTokenFound = true;
						break;

					// Multi-character token
					} else if (tokenType.lexerize) {
						let token = tokenType.lexerize(this);
						if (!token) lexerError(`Token Type's lexerize() method should return a Token`);

						// Pushing
						listTokens.push(token);
						isTokenFound = true;
						break;
					}

					// "No lexerize() method" lexer error
					lexerError(`Token type '${tokenType.type}' should have the lexerize() method unless there is a 'one-char' flag`);
				}
			}

			// "Undefined Token" error
			if (!isTokenFound)
				return res.failure(this.filename, this.position.clone(), `Undefined character '${this.at()}'`);

			// Advancing to the next character
			this.advance();
		}

		listTokens.push( new Token("EOF")
			.setPos(this.position.clone()) );

		return res.success(listTokens);
	}
}

module.exports = Lexer;