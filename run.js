let Lexer = require("./frontend/lexer/lexer.js");

let run = function(code, flags) {
	let showLexer = flags.includes("--lexer");
	// ---------------------------------------------

	let lexer = new Lexer(code);
	let tokens = lexer.lexerize();

	if (showLexer)
		console.log(tokens);
}

module.exports = run;