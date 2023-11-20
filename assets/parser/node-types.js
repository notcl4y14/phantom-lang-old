let ParseResult = require("../../frontend/parser/parse-result.js");

let parserNodeTypes = {
	start: "primaryExpr",
	nodes: {
		// ----------------------------------------------------------
		// Expressions
		// ----------------------------------------------------------
		primaryExpr: {
			name: "primaryExpr",
			default: null,
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
					
				}

				// Setting the value variable to the token value.
				// Uses token type instead if value is null.
				let value = token.value ? token.value : token.type;

				// Unexpected token
				return res.failure(parser.filename, token.rightPos, `Unexpected token '${value}'`);
			}
		}
	}
}

module.exports = parserNodeTypes;