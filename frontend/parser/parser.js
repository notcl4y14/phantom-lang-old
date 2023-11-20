let Error = require("../error.js");
let ParseResult = require("../../frontend/parser/parse-result.js");
let parserNodeTypes = require("../../assets/parser/node-types.js");

let Parser = class {
	constructor(filename, listTokens) {
		this.filename = filename;
		this.listTokens = listTokens;
		this.position = -1;

		this.advance();
	}

	// Advances to the next token
	advance() {
		let token = this.at();
		this.position += 1;
		return token;
	}

	// Returns the current token
	at() {
		return this.listTokens[this.position];
	}

	// Checks if the parser has not reached the end of file
	notEOF() {
		return this.at().type != "EOF";
	}

	// Makes AST
	parse() {
		let program = {
			type: "program",
			body: []
		}

		let startNodeType = parserNodeTypes.nodes[parserNodeTypes.start];
		let result = new ParseResult();

		while (this.notEOF()) {
			if (!this.notEOF()) break;

			let res = this.parseNodeType(startNodeType);
			if (res.error) return res;

			program.body.push(res);
		}

		return result.success(program);
	}

	// Puts the result in a ParseResult and checks for error
	// Also moves to the next parser node type if it didn't get a returned value
	parseNodeType(nodeType) {
		let res = new ParseResult();
		let result = res.register(nodeType.parse(this));

		if (!result)
			result = res.register(
				parserNodeTypes.nodes[nodeType.default]
					.parse(this));

		if (res.error) return res;

		return result;
	}
}

module.exports = Parser;