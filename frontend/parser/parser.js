let ParseResult = require("../../frontend/parser/parse-result.js");

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

		let result = new ParseResult();

		while (this.notEOF()) {
			if (!this.notEOF()) break;

			let res = result.register(this.parseStmt());
			if (res.error) return res;

			program.body.push(res);
		}

		return result.success(program);
	}
	
	// ----------------------------------------------------------
	// Statements
	// ----------------------------------------------------------
	parseStmt() {
		let stmt = this.parseExpr();
		return stmt;
	}

	// ----------------------------------------------------------
	// Expressions
	// ----------------------------------------------------------
	parseExpr() {
		let expr = this.parseAddExpr();
		return expr;
	}

	parseAddExpr() {
		let res = new ParseResult();
		let left = res.register(this.parseMultExpr());
		if (res.error) return res;

		while (this.notEOF() && ["+", "-"].includes(this.at().value)) {
			let operator = this.advance();
			let right = res.register(this.parseMultExpr());
			if (res.error) return res;

			return res.success({
				type: "binary-expr",
				left, operator, right
			});
		}

		return res.success(left);
	}

	parseMultExpr() {
		let res = new ParseResult();
		let left = res.register(this.parsePrimaryExpr());
		if (res.error) return res;

		while (this.notEOF() && ["*", "/", "%"].includes(this.at().value)) {
			let operator = this.advance();
			let right = res.register(this.parsePrimaryExpr());
			if (res.error) return res;

			return res.success({
				type: "binary-expr",
				left, operator, right
			});
		}

		return res.success(left);
	}

	parsePrimaryExpr() {
		let res = new ParseResult();
		let token = this.advance();

		// numeric-literal
		if (token.type == "number") {
			return res.success({
				type: "numeric-literal",
				value: token.value
			});

		// string-literal
		} else if (token.type == "string") {
			return res.success({
				type: "string-literal",
				value: token.value
			});
		
		// identifier | literal
		} else if (token.type == "identifier") {

			// literal
			if (["null", "undefined", "true", "false"].includes(token.value))
				return res.success({
					type: "literal",
					value: token.value
				});

			// identifier
			return res.success({
				type: "identifier",
				value: token.value
			});
		
		// parenthesised expression
		} else if (token.matches("parenthesis", "(")) {
			// this.advance();
			let expr = res.register(this.parseStmt());
			if (res.error) return res;

			if (!this.at().matches("parenthesis", ")"))
				return res.failure(this.filename, this.at().rightPos, "Expected ')'");

			this.advance();

			return res.success(expr);

		// unary expression
		} else if (token.matches("operator", "-") || token.matches("symbol", "!")) {
			let operator = token.value;
			let argument = res.register(this.parseExpr());
			if (res.error) return res;

			return res.success({
				type: "unary-expr",
				operator: operator,
				argument: argument
			});
		}

		// Setting the value variable to the token value.
		// Uses token type instead if value is null.
		let value = token.value ? token.value : token.type;

		// Unexpected token
		return res.failure(this.filename, token.rightPos, `Unexpected token '${value}'`);
	}
}

module.exports = Parser;