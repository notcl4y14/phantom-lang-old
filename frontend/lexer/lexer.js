let Token = require("./token.js");
let Error = require("../error.js");
let Position = require("../position.js");

let lexerKeywords = ["let", "var", "if", "else", "for", "while", "function"];

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

	// Checks if the this is not at the end of file
	notEOF() {
		return this.position.index < this.code.length;
	}

	// ---------------------------------------------------------------------------

	// Makes tokens
	lexerize() {
		let res = new lexerResult();
		let listTokens = [];

		while (this.notEOF()) {

			if (this.at() == " \t\r\n") {
				// Skip

			} else if (this.at(2) == "//") {
				listTokens.push( this.lexerizeComment() );

			} else if (this.at(2) == "/*") {
				listTokens.push( this.lexerizeMultilineComment() );

			} else if (["<=", ">=", "==", "!=", "&&", "||"].includes(this.at(2))) {
				listTokens.push( new Token("operator", this.at(2))
					.setPos(this.position.clone()));

				this.advance();

			} else if (("+-*/%<>=").includes(this.at())) {
				listTokens.push( new Token("operator", this.at())
					.setPos(this.position.clone()));

			} else if (("()").includes(this.at())) {
				listTokens.push( new Token("parenthesis", this.at())
					.setPos(this.position.clone()));

			} else if (("[]").includes(this.at())) {
				listTokens.push( new Token("bracket", this.at())
					.setPos(this.position.clone()));

			} else if (("{}").includes(this.at())) {
				listTokens.push( new Token("brace", this.at())
					.setPos(this.position.clone()));

			} else if (("!&|.,:;").includes(this.at())) {
				listTokens.push( new Token("symbol", this.at())
					.setPos(this.position.clone()));

			} else if (("1234567890").includes(this.at())) {
				listTokens.push( this.lexerizeNumber() );

			} else if (("\"'`").includes(this.at())) {
				listTokens.push( this.lexerizeString() );
				
			} else if (("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_").includes(this.at())) {
				listTokens.push( this.lexerizeIdent() );
			}

			// Advancing to the next character
			this.advance();
		}

		listTokens.push( new Token("EOF")
			.setPos(this.position.clone()) );

		return res.success(listTokens);
	}

	// ---------------------------------------------------------------------------

	lexerizeComment() {
		let leftPos = this.position.clone();
		let commentStr = "";
		this.advance(2);

		while (this.notEOF() && this.at(2) != "\r\n") {
			commentStr += this.at();
			this.advance();
		}

		let rightPos = this.position.clone();

		return new Token("comment", commentStr)
			.setPos(leftPos, rightPos);
	}

	lexerizeMultilineComment() {
		let leftPos = this.position.clone();
		let commentStr = "";
		this.advance(2);

		while (this.notEOF() && this.at(2) != "*/") {
			commentStr += this.at();
			this.advance();
		}

		let rightPos = this.position.clone();

		return new Token("comment", commentStr)
			.setPos(leftPos, rightPos);
	}

	lexerizeNumber() {
		let leftPos = this.position.clone();
		let numStr = "";
		let float = false;

		while (this.notEOF() && ("1234567890.").includes(this.at())) {

			if (this.at() == ".") {
				if (float) break;
				numStr += ".";
				float = true;

			} else {
				numStr += this.at();
			}

			this.advance();
		}

		let rightPos = this.position.clone();

		this.advance(-1);

		return new Token("number", Number(numStr))
			.setPos(leftPos, rightPos);
	}

	lexerizeString() {
		let leftPos = this.position.clone();
		let quote = this.at();
		let str = "";

		this.advance();

		while (this.notEOF() && this.at() != quote) {
			str += this.at();
			this.advance();
		}

		let rightPos = this.position.clone();

		return new Token("string", str)
			.setPos(leftPos, rightPos);
	}

	lexerizeIdent() {
		let leftPos = this.position.clone();
		let identStr = "";

		while (this.notEOF() && ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_" + "1234567890").includes(this.at())) {
			identStr += this.at();
			this.advance();
		}

		let rightPos = this.position.clone();

		this.advance(-1);

		if (lexerKeywords.includes(identStr))
			return new Token("keyword", identStr)
				.setPos(leftPos, rightPos);

		return new Token("identifier", identStr)
			.setPos(leftPos, rightPos)
	}
}

module.exports = Lexer;