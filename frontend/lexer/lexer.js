let rfr = require("rfr");
let Token = rfr("frontend/lexer/token.js");
let Error = rfr("frontend/error.js");
let Position = rfr("frontend/position.js");

let lexerKeywords = ["let", "var", "if", "else", "for", "while", "function"];

let lexerResult = class {
	constructor(filename) {
		this.filename = filename;
		this.list = null;
		this.error = null;
	}

	success(list) {
		this.list = list;
		return this;
	}

	failure(details, position) {
		this.error = new Error(this.filename, position, details);
		return this;
	}
}

let Lexer = class {
	constructor(filename, code) {
		this.filename = filename;
		this.code = code;
		this.position = new Position(-1, 0, -1);

		// advancing to the first token
		this.advance();
	}

	// Advances to the next character
	advance(delta = 1) {
		let char = this.at();
		this.position.advance(this.at(), delta);
		return char;
	}

	// Returns the current character
	at(range = 1) {
		let index = this.position.index;

		if (range == 1) {
			return this.code[index];
		}

		return this.code.substr(index, range);
	}

	// Checks if the lexer is at the end of the file
	isEof() {
		return this.position.index >= this.code.length;
	}

	// ---------------------------------------------------------------------------

	// Makes tokens
	lexerize() {
		let res = new lexerResult(this.filename);
		let listTokens = [];

		while (!this.isEof()) {

			if ((" \t\r\n").includes(this.at())) {
				// Skip

			} else if (this.at(2) == "//") {
				listTokens.push( this.lexerizeComment() );

			} else if (this.at(2) == "/*") {
				listTokens.push( this.lexerizeMultilineComment() );

			} else if (["+=", "-=", "*=", "/=", "%=", "<=", ">=", "==", "!=", "&&", "||"].includes(this.at(2))) {
				let leftPos = this.position.clone();
				let result = null;

				switch (this.at()) {
					case "+=": result = new Token(Token.Type.PlusEq); break;
					case "-=": result = new Token(Token.Type.MinusEq); break;
					case "*=": result = new Token(Token.Type.MultEq); break;
					case "/=": result = new Token(Token.Type.DivEq); break;
					case "%=": result = new Token(Token.Type.ModEq); break;
					case "<=": result = new Token(Token.Type.LessEq); break;
					case ">=": result = new Token(Token.Type.GreaterEq); break;
					case "==": result = new Token(Token.Type.IsEqal); break;
					case "!=": result = new Token(Token.Type.NotEquals); break;
					case "&&": result = new Token(Token.Type.And); break;
					case "||": result = new Token(Token.Type.Or); break;
				}
				// listTokens.push( new Token("operator", this.at(2))
					// .setPos(this.position.clone()));

				this.advance();
				listTokens.push( result.setPos(leftPos, this.position.clone()) );

			} else if (("+-*/%<>=!").includes(this.at())) {
				let result = null;
				// listTokens.push( new Token("operator", this.at())
					// .setPos(this.position.clone()));

				switch (this.at()) {
					case "+": result = new Token(Token.Type.Plus); break;
					case "-": result = new Token(Token.Type.Minus); break;
					case "*": result = new Token(Token.Type.Mult); break;
					case "/": result = new Token(Token.Type.Div); break;
					case "%": result = new Token(Token.Type.Mod); break;
					case "<": result = new Token(Token.Type.Less); break;
					case ">": result = new Token(Token.Type.Greater); break;
					case "=": result = new Token(Token.Type.Equals); break;
					case "!": result = new Token(Token.Type.Not); break;
				}

				listTokens.push( result.setPos(this.position.clone()) );

			} else if (("()[]{}").includes(this.at())) {
				// listTokens.push( new Token("parenthesis", this.at())
					// .setPos(this.position.clone()));
				let result = null;

				switch (this.at()) {
					case "(": result = new Token(Token.Type.LeftParen); break;
					case ")": result = new Token(Token.Type.RightParen); break;
					case "[": result = new Token(Token.Type.LeftBracket); break;
					case "]": result = new Token(Token.Type.RightBracket); break;
					case "{": result = new Token(Token.Type.LeftBrace); break;
					case "}": result = new Token(Token.Type.RightBrace); break;
				}

				listTokens.push( result.setPos(this.position.clone()) );

			} else if (("&|.,:;").includes(this.at())) {
				// listTokens.push( new Token("symbol", this.at())
					// .setPos(this.position.clone()));
				let result = null;

				switch (this.at()) {
					case "&": result = new Token(Token.Type.Ampersand); break;
					case "|": result = new Token(Token.Type.Pipe); break;
					case ".": result = new Token(Token.Type.Dot); break;
					case ",": result = new Token(Token.Type.Comma); break;
					case ":": result = new Token(Token.Type.Colon); break;
					case ";": result = new Token(Token.Type.Semicolon); break;
				}

				listTokens.push( result.setPos(this.position.clone()) );

			} else if (("1234567890").includes(this.at())) {
				listTokens.push( this.lexerizeNumber() );

			} else if (("\"'`").includes(this.at())) {
				listTokens.push( this.lexerizeString() );
				
			} else if (("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_").includes(this.at())) {
				listTokens.push( this.lexerizeIdent() );

			} else {
				let leftPos = this.position.clone();
				let char = this.advance();
				let rightPos = this.position.clone();

				return res.failure(`Undefined character '${char}'`, [leftPos, rightPos]);
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

		while (!this.isEof() && this.at(2) != "\r\n") {
			commentStr += this.at();
			this.advance();
		}

		let rightPos = this.position.clone();

		return new Token(Token.Type.Comment, commentStr)
			.setPos(leftPos, rightPos);
	}

	lexerizeMultilineComment() {
		let leftPos = this.position.clone();
		let commentStr = "";
		this.advance(2);

		while (!this.isEof() && this.at(2) != "*/") {
			commentStr += this.at();
			this.advance();
		}

		// Advance from the "/"
		this.advance();
		let rightPos = this.position.clone();

		return new Token(Token.Type.Comment, commentStr)
			.setPos(leftPos, rightPos);
	}

	lexerizeNumber() {
		let leftPos = this.position.clone();
		let numStr = "";
		let float = false;

		while (!this.isEof() && ("1234567890.").includes(this.at())) {

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

		return new Token(Token.Type.Number, Number(numStr))
			.setPos(leftPos, rightPos);
	}

	lexerizeString() {
		let leftPos = this.position.clone();
		let quote = this.at();
		let str = "";

		this.advance();

		while (!this.isEof() && this.at() != quote) {
			str += this.at();
			this.advance();
		}

		let rightPos = this.position.clone();

		return new Token(Token.Type.String, str)
			.setPos(leftPos, rightPos);
	}

	lexerizeIdent() {
		let leftPos = this.position.clone();
		let identStr = "";

		while (!this.isEof() && ("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_" + "1234567890").includes(this.at())) {
			identStr += this.at();
			this.advance();
		}

		let rightPos = this.position.clone();

		this.advance(-1);

		if (lexerKeywords.includes(identStr)) {
			return new Token(Token.Type.Keyword, identStr)
				.setPos(leftPos, rightPos);
		}

		return new Token(Token.Type.Identifier, identStr)
			.setPos(leftPos, rightPos);
	}
}

module.exports = Lexer;