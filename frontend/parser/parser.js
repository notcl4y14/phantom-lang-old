let ParseResult = require("../../frontend/parser/parse-result.js");

let newNode = function(obj) {
	let node = obj;

	obj.setPos = function(left, right) {
		this.leftPos = left;
		this.rightPos = right;

		// Removing the function from the object
		delete obj.setPos;

		return this;
	}

	return node;
}

let Parser = class {
	constructor(filename, listTokens) {
		this.filename = filename;
		this.listTokens = listTokens;
		this.position = -1;

		this.advance();
	}

	// Advances to the next token
	advance(delta = 1) {
		let token = this.at();
		this.position += delta;
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
			comments: [],
			body: []
		};

		let result = new ParseResult();

		while (this.notEOF()) {
			if (!this.notEOF()) break;

			let res = result.register(this.parseStmt());
			if (result.error) return result;

			if (res) {
				if (res.type == "comment-expr") {
					program.comments.push(res);
					continue;
				}

				program.body.push(res);
			}
		}

		return result.success(program);
	}
	
	// ---------------------------------------------------------------------------
	// Statements
	// ---------------------------------------------------------------------------
	parseStmt() {
		if (this.at().type == "keyword" && ["let", "var"].includes(this.at().value)) {
			return this.parseVariableDeclaration();
		}

		let stmt = this.parseExpr();
		return stmt;
	}

	// ---------------------------------------------------------------------------

	parseVariableDeclaration() {
		let res = new ParseResult();

		let keyword = this.advance();
		let leftPos = keyword.leftPos;

		// primary-expr is used instead to prevent parser from detecting
		// a variable-assignment node "(let) x = 5"
		let name = res.register(this.parsePrimaryExpr());
		if (res.error) return res;

		if (name.type !== "identifier")
			return res.failure(this.filename, name.rightPos, "Expected an identifier");

		// (let | var) (identifier);
		if (!this.at().matches("operator", "=")) {
			let rightPos = name.rightPos;

			return res.success(newNode({
				type: "var-declaration",
				name: name,
				value: {type: "literal", value: "null"}
			}).setPos(leftPos, rightPos));
		}

		// (let | var) (identifier) = (value);
		this.advance();

		let value = res.register(this.parseExpr());
		if (res.error) return res;

		let rightPos = value.rightPos;

		return res.success(
			newNode({
				type: "var-declaration",
				name: name,
				value: value
			}).setPos(leftPos, rightPos));
	}

	// ---------------------------------------------------------------------------
	// Expressions
	// ---------------------------------------------------------------------------
	parseExpr() {
		// var-assignment
		if (this.at().type == "identifier" && this.at(1).matches("operator", "="))
			return this.parseVarAssignment();

		let expr = this.parseLogicExpr();
		return expr;
	}

	parseVarAssignment() {
		let res = new ParseResult();

		let name = this.advance(2);
		let value = res.register(this.parseExpr());
		if (res.error) return res;

		let leftPos = name.leftPos;
		let rightPos = value.rightPos;

		return res.success(
			newNode({
				type: "var-assignment",
				name: name,
				value: value
			}).setPos(leftPos, rightPos));
	}

	// ---------------------------------------------------------------------------

	parseLogicExpr() {
		let res = new ParseResult();
		let left = res.register(this.parseCompExpr());
		if (res.error) return res;

		while (this.notEOF() && this.at().type == "operator" && ["&&", "||"].includes(this.at().value)) {
			let operator = this.advance().value;
			let right = res.register(this.parseCompExpr());
			if (res.error) return res;

			let leftPos = left.leftPos;
			let rightPos = right.rightPos;

			return res.success(
				newNode({
					type: "logical-expr",
					left, operator, right
				}).setPos(leftPos, rightPos));
		}

		return res.success(left);
	}

	parseCompExpr() {
		let res = new ParseResult();
		let left = res.register(this.parseAddExpr());
		if (res.error) return res;

		while (this.notEOF() && this.at().type == "operator" && ["<", ">", "<=", ">=", "==", "!="].includes(this.at().value)) {
			let operator = this.advance().value;
			let right = res.register(this.parseAddExpr());
			if (res.error) return res;

			let leftPos = left.leftPos;
			let rightPos = right.rightPos;

			return res.success(
				newNode({
					type: "binary-expr",
					left, operator, right
				}).setPos(leftPos, rightPos));
		}

		return res.success(left);
	}

	parseAddExpr() {
		let res = new ParseResult();
		let left = res.register(this.parseMultExpr());
		if (res.error) return res;

		while (this.notEOF() && this.at().type == "operator" && ["+", "-"].includes(this.at().value)) {
			let operator = this.advance().value;
			let right = res.register(this.parseMultExpr());
			if (res.error) return res;

			let leftPos = left.leftPos;
			let rightPos = right.rightPos;

			return res.success(
				newNode({
					type: "binary-expr",
					left, operator, right
				}).setPos(leftPos, rightPos));
		}

		return res.success(left);
	}

	parseMultExpr() {
		let res = new ParseResult();
		let left = res.register(this.parsePrimaryExpr());
		if (res.error) return res;

		while (this.notEOF() && this.at().type == "operator" && ["*", "/", "%"].includes(this.at().value)) {
			let operator = this.advance().value;
			let right = res.register(this.parsePrimaryExpr());
			if (res.error) return res;

			let leftPos = left.leftPos;
			let rightPos = right.rightPos;

			return res.success(
				newNode({
					type: "binary-expr",
					left, operator, right
				}).setPos(leftPos, rightPos));
		}

		return res.success(left);
	}

	// ---------------------------------------------------------------------------

	parsePrimaryExpr() {
		let res = new ParseResult();
		let token = this.advance();

		let leftPos = token.leftPos;
		let rightPos = token.rightPos;

		// numeric-literal
		if (token.type == "number") {
			return res.success(
				newNode({
					type: "numeric-literal",
					value: token.value
				}).setPos(leftPos, rightPos));

		// string-literal
		} else if (token.type == "string") {
			return res.success(
				newNode({
					type: "string-literal",
					value: token.value
				}).setPos(leftPos, rightPos));
		
		// identifier | literal
		} else if (token.type == "identifier") {

			// literal
			if (["null", "undefined", "true", "false"].includes(token.value))
				return res.success(
					newNode({
						type: "literal",
						value: token.value
					}).setPos(leftPos, rightPos));

			// identifier
			return res.success(
				newNode({
					type: "identifier",
					value: token.value
				}).setPos(leftPos, rightPos));
		
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

			let rightPos = argument.rightPos;

			return res.success(
				newNode({
					type: "unary-expr",
					operator: operator,
					argument: argument
				}).setPos(leftPos, rightPos));

		// comment expression
		} else if (token.type == "comment") {
			return res.success(
				newNode({
					type: "comment-expr",
					value: token.value
				}).setPos(leftPos, rightPos));

		// semicolon
		} else if (token.matches("symbol", ";")) {
			return res.success();
		}

		// Setting the value variable to the token value.
		// Uses token type instead if value is null.
		let value = token.value ? token.value : token.type;

		// Unexpected token
		return res.failure(this.filename, token.rightPos, `Unexpected token '${value}'`);
	}
}

module.exports = Parser;