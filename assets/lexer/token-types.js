let Token = require("../../frontend/lexer/token.js");
let lexerKeywords = require("./keywords.json");

let lexerTokenTypes = [
	// ----------------------------------------------------------
	// Multi-character
	// ----------------------------------------------------------
	{
		type: "comment",
		find: "//",
		flags: ["multi-char"],

		lexerize: function(lexer) {
			let leftPos = lexer.position.clone();
			let commentStr = "";
			lexer.advance(2);

			while (lexer.notEOF() && lexer.at(2) != "\r\n") {
				commentStr += lexer.at();
				lexer.advance();
			}

			let rightPos = lexer.position.clone();

			return new Token(this.type, commentStr)
				.setPos(leftPos, rightPos);
		}
	},
	{
		type: "multiline-comment",
		find: "/*",
		flags: ["multi-char"],

		lexerize: function(lexer) {
			let leftPos = lexer.position.clone();
			let commentStr = "";
			lexer.advance(2);

			while (lexer.notEOF() && lexer.at(2) != "*/") {
				commentStr += lexer.at();
				lexer.advance();
			}

			let rightPos = lexer.position.clone();

			return new Token("comment", commentStr)
				.setPos(leftPos, rightPos);
		}
	},

	// ----------------------------------------------------------
	// Ignore
	// ----------------------------------------------------------
	{
		type: "whitespace",
		find: " \t\r\n",
		flags: ["ignore"]
	},

	// ----------------------------------------------------------
	// One-character
	// ----------------------------------------------------------
	{
		type: "operator",
		find: ["<=", ">=", "==", "!="],
		flags: ["multi-char"],

		lexerize: function(lexer) {
			let leftPos = lexer.position.clone();
			let str = lexer.at(2);
			console.log(str);
			lexer.advance(2);
			let rightPos = lexer.position.clone();

			return new Token("operator", str)
				.setPos(leftPos, rightPos);
		}
	},
	{
		type: "operator",
		find: "<>=",
		flags: ["one-char"]
	},
	{
		type: "operator",
		find: "+-*/%",
		flags: ["one-char"]
	},
	{
		type: "parenthesis",
		find: "()",
		flags: ["one-char"]
	},
	{
		type: "bracket",
		find: "[]",
		flags: ["one-char"]
	},
	{
		type: "brace",
		find: "{}",
		flags: ["one-char"]
	},
	{
		type: "symbol",
		find: "!&|.,:;",
		flags: ["one-char"]
	},

	// ----------------------------------------------------------
	// Multi-character token
	// ----------------------------------------------------------
	{
		type: "number",
		find: "1234567890",
		flags: [],

		lexerize: function(lexer) {
			let leftPos = lexer.position.clone();
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

			let rightPos = lexer.position.clone();

			lexer.advance(-1);

			return new Token(this.type, Number(numStr))
				.setPos(leftPos, rightPos);
		}
	},
	{
		type: "string",
		find: "\"'`",
		flags: [],

		lexerize: function(lexer) {
			let leftPos = lexer.position.clone();
			let quote = lexer.at();
			let str = "";

			lexer.advance();

			while (lexer.notEOF() && lexer.at() != quote) {
				str += lexer.at();
				lexer.advance();
			}

			let rightPos = lexer.position.clone();

			return new Token(this.type, str)
				.setPos(leftPos, rightPos);
		}
	},
	{
		type: "identifier",
		find: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_",
		flags: [],

		lexerize: function(lexer) {
			let leftPos = lexer.position.clone();
			let identStr = "";

			while (lexer.notEOF() && (this.find + "1234567890").includes(lexer.at())) {
				identStr += lexer.at();
				lexer.advance();
			}

			let rightPos = lexer.position.clone();

			lexer.advance(-1);

			if (lexerKeywords.includes(identStr))
				return new Token("keyword", identStr)
					.setPos(leftPos, rightPos);

			return new Token(this.type, identStr)
				.setPos(leftPos, rightPos)
		}
	}
];

module.exports = lexerTokenTypes;