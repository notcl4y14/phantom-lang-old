let ParseResult = require("../../frontend/parser/parse-result.js");
let parserNodeTypes = require("../../assets/parser/node-types.js");

// Outputs the parser error and exits the program
let parserError = function(value) {
	console.error(`parser error: ${value}`);
	process.exit();
}

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
	at(delta = 0) {
		return this.listTokens[this.position + delta];
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

		let startNodeType = this.getNodeType(parserNodeTypes.start);
		let result = new ParseResult();

		while (this.notEOF()) {
			if (!this.notEOF()) break;

			let res = this.parseNodeType(startNodeType);
			if (res.error) return res;

			program.body.push(res);
		}

		return result.success(program);
	}

	// Parses a specific node type
	parseNode(nodeType) {
		let result = this.getNodeType(nodeType);

		if (!result)
			parserError(`Undefined type '${nodeType}'`);

		return result.parse(this);
	}

	getNodeType(nodeType) {
		for (let i = 0; i < parserNodeTypes.nodes.length; i += 1) {
			if (parserNodeTypes.nodes[i].name == nodeType)
				return parserNodeTypes.nodes[i];
		}

		return;
	}

	// Parses the node type and puts the result in a ParseResult and checks for the error
	parseNodeType(nodeType) {
		let res = new ParseResult();

		let result = res.register(nodeType.parse(this));
		if (res.error) return res;

		return result;
	}
}

module.exports = Parser;