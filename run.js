let utils = require("util");
let Lexer = require("./frontend/lexer/lexer.js");
let Parser = require("./frontend/parser/parser.js");
let Interpreter = require("./frontend/interpreter/interpreter.js");

let logProcess = function(value) {
	console.log(`PROCESS: ${value}`);
}

let run = function(filename, code, flags) {
	let showProcess = flags.includes("--show-process");
	let showLexer = flags.includes("--lexer");
	let showParser = flags.includes("--parser");
	let showInterp = flags.includes("--rtvalue");
	// ---------------------------------------------

	// Lexer
	if (showProcess) logProcess("lexerizing...");
	let lexer = new Lexer(filename, code);
	let tokens = lexer.lexerize();

	// Checking lexer error
	if (tokens.error) {
		console.log(tokens.error.asString());
		return;
	}

	// Output tokens
	if (showLexer)
		// for (token of tokens.list) console.log(token.asString());
		console.log(tokens.list);

	// Parser
	if (showProcess) logProcess("parsing...");
	let parser = new Parser(filename, tokens.list);
	let ast = parser.parse();

	// Checking parser error
	if (ast.error) {
		console.log(ast.error.asString());
		return;
	}

	// Output AST
	if (showParser)
		console.log(utils.inspect(ast.node, {showHidden: false, depth: null, colors: true}));

	// Interpreter
	if (showProcess) logProcess("interpreting...");
	let interp = new Interpreter(filename);
	let result = interp.evalPrimary(ast.node);

	// Checking interpreter error
	if (result.error) {
		console.log(result.error.asString());
		return;
	}

	// Output last evaluated value
	if (showInterp)
		console.log(result.value);
}

module.exports = run;