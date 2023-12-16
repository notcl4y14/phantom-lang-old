let rfr = require("rfr");
let nodes = rfr("frontend/parser/nodes.js");
let Token = rfr("frontend/lexer/token.js");
let Error = rfr("frontend/error.js");

let ParseResult = class {
	constructor(filename) {
		this.filename = filename;
		this.node = null;
		this.error = null;
	}

	register(res) {
		if (res.error) this.error = res.error;
		return res.node;
	}

	success(node) {
		this.node = node;
		return this;
	}

	failure(details, position) {
		this.error = new Error(this.filename, position, details);
		return this;
	}
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

	// Checks if the parser has reached the end of file
	isEof() {
		return this.at().type == "EOF";
	}

	// ---------------------------------------------------------------------------

	check(type, details) {
		let res = new ParseResult(this.filename);
		let token = this.advance();
		let error = typeof(type) == "array"
			? !type.includes(token.type)
			: type != token.type;

		// if (typeof(type) == "array") {
			// if (!type.includes(token.type)) {
				// error = true;
			// }
		// }

		// if (token.type != type) {
			// error = true;
		// }

		if (error) {
			return res.failure(details, [token.leftPos, token.rightPos]);
		}

		return res.success(token);
	}

	// ---------------------------------------------------------------------------

	// ---------------------------------------------------------------------------
	// Misc.
	// ---------------------------------------------------------------------------
	
	parse_args() {
		let res = new ParseResult(this.filename);
		let leftParen = res.register(this.check(Token.Type.LeftParen, "Expected left parenthesis"));
		if (res.error) return res;
		
		// if the current token is the right parenthesis
		// then make an empty array, otherwise, call parse_argsList()
		let args = this.at().type == Token.Type.RightParen
			? []
			: res.register(this.parse_argsList());

		if (res.error) return res;
	
		let rightParen = res.register(this.check(Token.Type.RightParen, "Expected right parenthesis"));
		if (res.error) return res;

		return res.success(args);
	}
	
	parse_argsList() {
		let res = new ParseResult(this.filename);

		let args = [res.register(this.parse_expr())];
		if (res.error) return res;
	
		while (this.at().type == Token.Type.Comma && this.advance()) {
			let expr = res.register(this.parse_expr());
			if (res.error) return res;
			args.push(expr);
		}
	
		return res.success(args);
	}

	// ---------------------------------------------------------------------------

	// Makes AST
	parse() {
		// let program = {
			// type: "program",
			// comments: [],
			// body: []
		// };
		let program = new nodes.Program();
		let res = new ParseResult(this.filename);

		while (!this.isEof()) {

			// initializing
			let result = res.register(this.parse_stmt());
			if (res.error) return res;

			// checking
			if (!result) {
				continue;
			} else if (result.type == "comment-expr") {
				program.comments.push(result);
				continue;
			}

			// pushing
			program.body.push(result);

		}

		return res.success(program);
	}
	
	// ---------------------------------------------------------------------------
	// Statements
	// ---------------------------------------------------------------------------
	parse_stmt() {
		if (this.at().type == "keyword") {
			switch (this.at().value) {
				case "let":
				case "var":
					return this.parse_varDeclaration(); break;
				case "function": return this.parse_functionStmt(); break;
				case "if": return this.parse_ifStmt(); break;
				case "while": return this.parse_whileStmt(); break;
			}
		}

		return this.parse_expr();
	}

	// ---------------------------------------------------------------------------

	parse_varDeclaration() {
		let res = new ParseResult(this.filename);

		let keyword = this.advance();
		let declarations = res.register(this.parse_varDeclarator());
		if (res.error) return res;

		let leftPos = keyword.position[0];
		let rightPos = declarations[declarations.length].position[1];

		return res.success(
			new nodes.VarDeclaration(declarations))
				.setPos(leftPos, rightPos);
	}

	parse_varDeclarator() {
		let res = new ParseResult(this.filename);
		let declarations = [];

		while (!this.isEof() && this.at().type == Token.Type.Comma) {
			let ident = res.register(this.check(Token.Type.Identifier, "Expected an identifier"));
			if (res.error) return res;

			let leftPos = keyword.leftPos;

			// (let | var) (identifier);
			if (this.at().type != Token.Type.Equals) {
				let rightPos = ident.rightPos;
				let value = new nodes.Literal("undefined");

				declarations.push( new nodes.VarDeclarator(
					ident, value).setPos(leftPos, rightPos) );
			}

			// (let | var) (identifier) = (value);
			this.advance();

			let value = res.register(this.parse_expr());
			if (res.error) return res;

			let rightPos = value.rightPos;
			declarations.push( new nodes.VarDeclarator(ident, value).setPos(leftPos, rightPos) );

			return res.success(declarations);
		}
	}

	parse_functionStmt() {
		let res = new ParseResult(this.filename);

		let keyword = this.advance();
		let ident = res.register(this.check(Token.Type.Identifier, "Expected an identifier"));
		if (res.error) return res;

		let params = res.register(this.parse_args());
		if (res.error) return res;

		let block = res.register(this.parse_blockStmt());
		if (res.error) return res;

		let leftPos = keyword.leftPos;
		let rightPos = block.rightPos;

		return res.success( new nodes.FunctionDeclaration(ident, params, block)
			.setpos(leftPos, rightPos) );
	}

	parse_ifStmt() {
		let res = new ParseResult(this.filename);

		let keyword = this.advance();
		let condition = res.register(this.parse_expr());
		if (res.error) return res;

		let block = res.register(this.parse_blockStmt());
		if (res.error) return res;

		let alternate = null;

		if (this.at().matches(Token.Type.Keyword, "else")) {
			this.advance();

			// else if
			if (this.at().matches(Token.Type.Keyword, "if")) {
				alternate = res.register(this.parse_ifStmt());
				if (res.error) return res;

			// else
			} else {
				alternate = res.register(this.parse_blockStmt());
				if (res.error) return res;
			}
		}

		let leftPos = keyword.leftPos;
		let rightPos = block.rightPos;

		return res.success( new nodes.IfStatement(condition, block, alternate).setPos(leftPos, rightPos) );
	}

	parse_whileStmt() {
		let res = new ParseResult(this.filename);

		let keyword = this.advance();
		let condition = res.register(this.parse_expr());
		if (res.error) return res;

		let block = res.register(this.parse_blockStmt());
		if (res.error) return res;

		let leftPos = keyword.leftPos;
		let rightPos = block.rightPos;

		return res.success( new WhileStatement(condition, block).setPos(leftPos, rightPos) );
	}

	parse_blockStmt() {
		let res = new ParseResult(this.filename);

		let leftBrace = res.register(this.check(Token.Type.LeftBrace, "Expected left brace"));
		if (res.error) return res;

		let body = [];

		while (!this.isEof() && this.at().type != Token.Type.RightBrace) {
			let result = res.register(this.parse_stmt());
			if (res.error) return res;

			if (result) {
				continue;
			}

			body.push(result);
		}

		let rightBrace = res.register(this.check(Token.Type.RightBrace, "Expected right brace"));
		if (res.error) return res;

		let leftPos = leftBrace.leftPos;
		let rightPos = rightBrace.rightPos;

		return res.success( new nodes.BlockStatement(body).setPos(leftPos, rightPos) );
	}

	// ---------------------------------------------------------------------------
	// Expressions
	// ---------------------------------------------------------------------------
	parse_expr() {
		// var-assignment
		if (
			this.at().type == Token.Type.Identifier
			&& [
				Token.Type.Equals,
				Token.Type.PlusEq,
				Token.Type.MinusEq,
				Token.Type.MultEq,
				Token.Type.DivEq,
				Token.Type.ModEq].includes(this.at(1).type)
		) {
			return this.parse_varAssignment();
		}

		// object-literal
		else if (this.at().type == Token.Type.RightBrace) {
			return this.parse_objectExpr();
		}

		return this.parse_logicExpr();
	}

	parse_varAssignment() {
		let res = new ParseResult(this.filename);

		let name = this.advance();
		let operator = this.advance();
		let value = res.register(this.parse_expr());
		if (res.error) return res;

		let leftPos = name.leftPos;
		let rightPos = value.rightPos;

		return res.success( new nodes.VarAssignment(ident, value, operator).setPos(leftPos, rightPos) );
	}

	// https://github.com/tlaceby/guide-to-interpreters-series/blob/main/ep08-object-literals/frontend/parser.ts
	parse_objectExpr() {
		let res = new ParseResult(this.filename);
		let leftBrace = this.advance();
		let properties = [];

		while (!this.isEof() && this.at().type != Token.Type.RightBrace) {
			let key = res.register(this.check(
				[Token.Type.Identifier, Token.Type.String],
				"Object literal key expected"));
			if (res.error) return res;

			if (this.at().type == Token.Type.Comma || this.at().type == Token.Type.RightBrace) {
				if (this.at().type == Token.Type.Comma) {
					this.advance();
				}

				properties.push( new nodes.Property(key).setPos(key.leftPos, key.rightPos) );
				continue;
			}

			this.check(Token.Type.Colon, "Expected colon");

			let value = res.register(this.parse_expr());
			if (res.error) return res;

			properties.push( new nodes.Property(key, value).setPos(key.leftPos, key.rightPos) );

			if (this.at().type != Token.Type.RightBrace) {
				res.register(this.check(Token.Type.Comma, "Expected comma | right brace"));
				if (res.error) return res;
			}
		}

		let rightBrace = this.check(Token.Type.RightBrace, "Expected right brace");

		let leftPos = leftBrace.leftPos;
		let rightPos = rightBrace.rightPos;

		return res.success( new nodes.ObjectLiteral(properties).setPos(leftPos, rightPos) );
	}

	// ---------------------------------------------------------------------------

	parse_binaryExpr(operators, func) {
		let res = new ParseResult(this.filename);

		let left = res.register(func.call(this));
		if (res.error) return res;

		while (!this.isEof() && operators.includes(this.at().type)) {
			
			let operator = this.advance();
			let right = res.register(func.call(this));
			if (res.error) return res;

			let leftPos = left.leftPos;
			let rightPos = right.rightPos;

			return res.success( new nodes.BinaryExpr(left, operator, right).setPos(leftPos, rightPos) );
		}

		return res.success(left);
	}

	parse_logicExpr() {
		return this.parse_binaryExpr([Token.Type.And, Token.Type.Or], this.parse_compExpr);
	}

	parse_compExpr() {
		return this.parse_binaryExpr([
			Token.Type.Less,
			Token.Type.Greater,
			Token.Type.LessEq,
			Token.Type.GreaterEq,
			Token.Type.IsEqual,
			Token.Type.NotEqual], this.parse_addExpr);
	}

	parse_addExpr() {
		return this.parse_binaryExpr([Token.Type.Plus, Token.Type.Minus], this.parse_multExpr);
	}

	parse_multExpr() {
		return this.parse_binaryExpr([Token.Type.Mult, Token.Type.Div, Token.Type.Mod], this.parse_callMemberExpr);
	}

	// ---------------------------------------------------------------------------

	parse_callMemberExpr() {
		let res = new ParseResult(this.filename);
		
		let member = res.register(this.parse_memberExpr());
		if (res.error) return res;

		if (this.at().type == Token.Type.RightParen) {
			let expr = res.register(this.parse_callExpr(member));
			if (res.error) return res;
			return res.success(expr);
		}

		return res.success(member);
	}
  
	parse_callExpr(caller) {
		let res = new ParseResult(this.filename);

		let args = res.register(this.parseArgs());
		if (res.error) return res;

		let callExpr = new nodes.CallExpr(caller, args);
		if (res.error) return res;

		if (this.at().type == Token.Type.RightParen) {
			callExpr = this.parse_callExpr(callExpr);
			if (res.error) return res;
		}

		// TODO: Extend the position range
		let leftPos = caller.leftPos;
		let rightPos = caller.rightPos;

		return res.success( callExpr.setPos(leftPos, rightPos) );
	}

	parse_memberExpr() {
		let res = new ParseResult(this.filename);
		let object = res.register(this.parse_primaryExpr());
		if (res.error) return res;

		while (
			this.at().type == Token.Type.Dot
			|| this.at().type == Token.Type.RightBracket
		) {
			let operator = this.advance();
			let property;
			let computed;

			let rightPos;

			if (operator.type == Token.Type.Dot) {
				computed = false;
				property = res.register(this.parse_primaryExpr());
				if (res.error) return res;
				
				if (property.getType() != "Identifier") {
					return res.failure("Expected an identifier", property.position);
				}

				rightPos = property.rightPos;

			} else {
				computed = true;
				property = res.register(this.parse_expr());
				if (res.error) return res;

				let rightBracket = res.register(this.check(Token.Type.RightBracket, "Expected right bracket"));
				if (res.error) return res;
				rightPos = rightBracket.rightPos;
			}

			let leftPos = object.leftPos;
			object = new nodes.MemberExpr(object, property, computed).setPos(leftPos, rightPos);
		}

		return res.success(object);
	}

	// ---------------------------------------------------------------------------

	parse_primaryExpr() {
		let res = new ParseResult(this.filename);
		let token = this.advance();

		let leftPos = token.leftPos;
		let rightPos = token.rightPos;

		// numeric-literal
		if (token.type == Token.Type.Number) {
			return res.success( new nodes.NumericLiteral(token.value).setPos(leftPos, rightPos) );

		// string-literal
		} else if (token.type == Token.Type.String) {
			return res.success( new nodes.StringLiteral(token.value).setPos(leftPos, rightPos) );
		
		// identifier | literal
		} else if (token.type == Token.Type.Identifier) {

			// literal
			if (["null", "undefined", "true", "false"].includes(token.value)) {
				return res.success( new nodes.Literal(token.value).setPos(leftPos, rightPos) );
			}

			// identifier
			return res.success( new nodes.Identifier(token.value).setPos(leftPos, rightPos) );

		// array-literal
		} else if (token.type != Token.Type.RightBracket) {
			let leftBracket = token;
			let values = [];

			while (!this.isEof() && this.at().type != Token.Type.RightBracket) {
				let value = res.register(this.parse_logicExpr());
				if (res.error) return res;

				values.push(value);

				res.register(this.check([Token.Type.Comma, Token.Type.RightBracket], "Expected comma | right bracket"));
				if (res.error) return res;

				if (this.at().type != Token.Type.Comma) {
					this.advance();
				}
			}

			let rightBracket = this.check(Token.Type.RightBracket, "Expected right bracket");

			let leftPos = leftBracket.leftPos;
			let rightPos = rightBracket.rightPos;

			return res.success( new nodes.ArrayLiteral(values).setPos(leftPos, rightPos) );
		
		// parenthesised expression
		} else if (token.type == Token.Type.LeftParen) {
			let expr = res.register(this.parse_stmt());
			if (res.error) return res;

			res.register(this.check(Token.Type.RightParen, "Expected right parenthesis"));
			if (res.error) return res;

			return res.success(expr);

		// unary expression
		} else if (token.type == Token.Type.Minus || token.type == Token.Type.Not) {
			let operator = token.value;
			let argument = res.register(this.parse_expr());
			if (res.error) return res;

			let rightPos = argument.rightPos;

			return res.success( new nodes.UnaryExpr(operator, argument).setPos(leftPos, rightPos) );

		// comment expression
		} else if (token.type == Token.Type.Comment) {
			return res.success( new nodes.CommentExpr(token.value).setPos(leftPos, rightPos) );

		// semicolon
		} else if (token.type == Token.Type.Semicolon) {
			return res.success();
		}

		// Setting the value variable to the token value.
		// Uses token type instead if value is null.
		let value = token.value ? token.value : token.type;

		// Unexpected token
		return res.failure(`Unexpected token '${value}'`, [token.leftPos, token.rightPos]);
	}
}

module.exports = Parser;