let ParseResult = require("../../frontend/parser/parse-result.js");

let parserNodeTypes = {
	start: "stmt",
	nodes: [
		// ----------------------------------------------------------
		// Statements
		// ----------------------------------------------------------
		{
			name: "stmt",
			parse: function(parser) {
				let stmt = parser.parseNode("expr");
				return stmt;
			}
		},

		// ----------------------------------------------------------
		// Expressions
		// ----------------------------------------------------------
		{
			name: "expr",
			parse: function(parser) {
				let expr = parser.parseNode("additiveExpr");
				return expr;
			}
		},

		{
			name: "additiveExpr",
			parse: function(parser) {
				let res = new ParseResult();
				let left = res.register(parser.parseNode("multiplicativeExpr"));
				if (res.error) return res;

				while (parser.notEOF() && ["+", "-"].includes(parser.at().value)) {
					let operator = parser.advance();
					let right = res.register(parser.parseNode("multiplicativeExpr"));
					if (res.error) return res;

					return res.success({
						type: "binary-expr",
						left, operator, right
					});
				}

				return res.success(left);
			}
		},

		{
			name: "multiplicativeExpr",
			parse: function(parser) {
				let res = new ParseResult();
				let left = res.register(parser.parseNode("primaryExpr"));
				if (res.error) return res;

				while (parser.notEOF() && ["*", "/", "%"].includes(parser.at().value)) {
					let operator = parser.advance();
					let right = res.register(parser.parseNode("primaryExpr"));
					if (res.error) return res;

					return res.success({
						type: "binary-expr",
						left, operator, right
					});
				}

				return res.success(left);
			}
		},

		{
			name: "primaryExpr",
			parse: function(parser) {
				let res = new ParseResult();
				let token = parser.advance();
	
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
					// parser.advance();
					let expr = res.register(parser.parseNode("stmt"));
					if (res.error) return res;

					if (!parser.at().matches("parenthesis", ")"))
						return res.failure(parser.filename, parser.at().rightPos, "Expected ')'");

					parser.advance();

					return res.success(expr);

				// unary expression
				} else if (token.matches("operator", "-") || token.matches("symbol", "!")) {
					let operator = token.value;
					let argument = res.register(parser.parseNode("expr"));
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
				return res.failure(parser.filename, token.rightPos, `Unexpected token '${value}'`);
			}
		}
	]
}

module.exports = parserNodeTypes;