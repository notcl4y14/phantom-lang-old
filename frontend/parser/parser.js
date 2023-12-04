let rfr = require("rfr");
let ParseResult = rfr("frontend/parser/parse-result.js");

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

	// ---------------------------------------------------------------------------

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

		} else if (this.at().matches("keyword", "if")) {
			return this.parseIfStatement();

		} else if (this.at().matches("keyword", "while")) {
			return this.parseWhileStatement();
		}

		return this.parseExpr();
	}

	// ---------------------------------------------------------------------------

	parseVariableDeclaration() {
		let res = new ParseResult();

		let keyword = this.advance();
		let leftPos = keyword.leftPos;

		// logic-expr is used instead to prevent parser from detecting
		// a variable-assignment node "(let) x = 5" when using parseExpr() instead
		let name = res.register(this.parseLogicExpr());
		if (res.error) return res;

		if (name.type !== "identifier")
			return res.failure(this.filename, [name.leftPos, name.rightPos], "Expected an identifier");

		// (let | var) (identifier);
		if (!this.at().matches("operator", "=")) {
			let rightPos = name.rightPos;

			return res.success(newNode({
				type: "var-declaration",
				name: name,
				value: {type: "literal", value: "undefined"}
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

	parseIfStatement() {
		let res = new ParseResult();

		let keyword = this.advance();
		let condition = res.register(this.parseExpr());
		if (res.error) return res;

		let block = res.register(this.parseBlockStatement());
		if (res.error) return res;

		let alternate = null;

		if (this.at().matches("keyword", "else")) {
			this.advance();

			// else if
			if (this.at().matches("keyword", "if")) {
				alternate = res.register(this.parseIfStatement());
				if (res.error) return res;

			// else
			} else {
				alternate = res.register(this.parseBlockStatement());
				if (res.error) return res;
			}
		}

		let leftPos = keyword.leftPos;
		let rightPos = block.rightPos;

		return res.success(
			newNode({
				type: "if-statement",
				condition: condition,
				block: block,
				alternate: alternate
			}).setPos(leftPos, rightPos));
	}

	parseWhileStatement() {
		let res = new ParseResult();

		let keyword = this.advance();
		let condition = res.register(this.parseExpr());
		if (res.error) return res;

		let block = res.register(this.parseBlockStatement());
		if (res.error) return res;

		let leftPos = keyword.leftPos;
		let rightPos = block.rightPos;

		return res.success(
			newNode({
				type: "while-statement",
				condition: condition,
				block: block
			}).setPos(leftPos, rightPos));
	}

	parseBlockStatement() {
		let res = new ParseResult();

		if (!this.at().matches("brace", "{")) {
			let token = this.at();
			return res.failure(this.filename, [token.leftPos, token.rightPos], "Expected '{'");
		}

		let leftBrace = this.advance();
		let body = [];

		while (this.notEOF() && !this.at().matches("brace", "}")) {
			let result = res.register(this.parseStmt());
			if (res.error) return res;

			if (result) body.push(result);
		}

		if (!this.at().matches("brace", "}")) {
			let token = this.at();
			return res.failure(this.filename, [token.leftPos, token.rightPos], "Expected '}'");
		}

		let rightBrace = this.advance();

		let leftPos = leftBrace.leftPos;
		let rightPos = rightBrace.rightPos;

		return res.success(
			newNode({
				type: "block-statement",
				body: body
			}).setPos(leftPos, rightPos));
	}

	// ---------------------------------------------------------------------------
	// Expressions
	// ---------------------------------------------------------------------------
	parseExpr() {
		// var-assignment
		if (this.at().type == "identifier" && this.at(1).type == "operator" && ["=", "+=", "-=", "*=", "/="].includes(this.at(1).value))
			return this.parseVarAssignment();

		// object-literal
		else if (this.at().matches("brace", "{"))
			return this.parseObjectExpr();

		let expr = this.parseLogicExpr();
		return expr;
	}

	parseVarAssignment() {
		let res = new ParseResult();

		let name = this.advance();
		let operator = this.advance();

		if (!["=", "+=", "-=", "*=", "/="].includes(operator.value))
			return res.failure(this.filename, [operator.leftPos, operator.rightPos], "Expected '=' or (+-*/) - '='");

		let value = res.register(this.parseExpr());
		if (res.error) return res;

		let leftPos = name.leftPos;
		let rightPos = value.rightPos;

		return res.success(
			newNode({
				type: "var-assignment",
				name: name,
				value: value,
				operator: operator.value
			}).setPos(leftPos, rightPos));
	}

	// https://github.com/tlaceby/guide-to-interpreters-series/blob/main/ep08-object-literals/frontend/parser.ts
	parseObjectExpr() {
		let res = new ParseResult();
		let leftBrace = this.advance();
		let properties = [];

		while (this.notEOF() && !this.at().matches("brace", "}")) {
			let key = this.advance();

			if (key.type != "identifier" && key.type != "string") {
				return res.failure(this.filename, [key.leftPos, key.rightPos], "Object literal key expected");
			}

			if (this.at().matches("symbol", ",")) {
				this.advance();
				properties.push(newNode({type: "property", key: key.value}).setPos(key.leftPos, key.rightPos));
				continue;
			} else if (this.at().matches("brace", "}")) {
				properties.push(newNode({type: "property", key: key.value}).setPos(key.leftPos, key.rightPos));
				continue;
			}

			if (!this.at().matches("symbol", ":")) {
				let token = this.at();
				return res.failure(this.filename, [token.leftPos, token.rightPos], "Expected ':'");
			}

			this.advance();

			let value = res.register(this.parseExpr());
			if (res.error) return res;

			properties.push(newNode({ type: "property", value, key: key.value }).setPos(key.leftPos, value.rightPos));

			if (!this.at().matches("brace", "}")) {
				if (!this.at().matches("symbol", ",")) {
					let token = this.at();
					return res.failure(this.filename, [token.leftPos, token.rightPos], "Expected ',' | '}'");
				}

				this.advance();
			}
		}

		if (!this.at().matches("brace", "}")) {
			let token = this.at();
			return res.failure(this.filename, [token.leftPos, token.rightPos], "Expected '}'");
		}

		let rightBrace = this.advance();

		let leftPos = leftBrace.leftPos;
		let rightPos = rightBrace.rightPos;

		return res.success(
			newNode({
				type: "object-literal",
				properties
			}).setPos(leftPos, rightPos));
	}

	// ---------------------------------------------------------------------------

	parseBinaryExpr(name, operators, func) {
		let res = new ParseResult();

		let left = res.register(func.call(this));
		if (res.error) return res;

		while (this.notEOF() && this.at().type == "operator" && operators.includes(this.at().value)) {
			
			let operator = this.advance().value;
			let right = res.register(func.call(this));
			if (res.error) return res;

			let leftPos = left.leftPos;
			let rightPos = right.rightPos;

			return res.success(
				newNode({
					type: name,
					left, operator, right
				}).setPos(leftPos, rightPos));
		}

		return res.success(left);
	}

	parseLogicExpr() {
		return this.parseBinaryExpr("logical-expr", ["&&", "||"], this.parseCompExpr);
	}

	parseCompExpr() {
		return this.parseBinaryExpr("binary-expr", ["<", ">", "<=", ">=", "==", "!="], this.parseAddExpr);
	}

	parseAddExpr() {
		return this.parseBinaryExpr("binary-expr", ["+", "-"], this.parseMultExpr);
	}

	parseMultExpr() {
		return this.parseBinaryExpr("binary-expr", ["*", "/", "%"], this.parsePrimaryExpr);
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

		// array-literal
		} else if (token.matches("bracket", "[")) {
			let leftBracket = token;
			let values = [];

			while (this.notEOF() && !this.at().matches("bracket", "]")) {
				let value = res.register(this.parseLogicExpr());
				if (res.error) return res;

				values.push(value);

				if (!(this.at().matches("symbol", ",") || this.at().matches("bracket", "]"))) {
					let token = this.at();
					return res.failure(this.filename, [token.leftPos, token.rightPos], "Expected ',' | ']'");
				}

				if (this.at().matches("symbol", ","))
					this.advance();
			}

			if (!this.at().matches("bracket", "]")) {
				let token = this.at();
				return res.failure(this.filename, [token.leftPos, token.rightPos], "Expected ']'");
			}

			let rightBracket = this.advance();

			let leftPos = leftBracket.leftPos;
			let rightPos = rightBracket.rightPos;

			return res.success(
				newNode({
					type: "array-literal",
					values: values
				}).setPos(leftPos, rightPos));
		
		// parenthesised expression
		} else if (token.matches("parenthesis", "(")) {
			// this.advance();
			let expr = res.register(this.parseStmt());
			if (res.error) return res;

			if (!this.at().matches("parenthesis", ")")) {
				let token = this.at();
				return res.failure(this.filename, [token.leftPos, token.rightPos], "Expected ')'");
			}

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
		return res.failure(this.filename, [token.leftPos, token.rightPos], `Unexpected token '${value}'`);
	}
}

module.exports = Parser;