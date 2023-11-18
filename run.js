let Lexer = require("./frontend/lexer/lexer.js");

let run = function(filename, code, flags) {
	let showLexer = flags.includes("--lexer");
	// ---------------------------------------------

	let lexer = new Lexer(filename, code);
	let tokens = lexer.lexerize();

	if (tokens.error) {
		console.log(tokens.error.asString());
		return;
	}

	if (showLexer)
		console.log(tokens.token);
}

module.exports = run;