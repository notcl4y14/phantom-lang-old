let rfr = require("rfr");
let utils = require("util");

let Lexer = rfr("frontend/lexer/lexer.js");
let Parser = rfr("frontend/parser/parser.js");
let Interpreter = rfr("frontend/interpreter/interpreter.js");
let VariableTable = rfr("frontend/interpreter/vartable.js");

let loadVarTable = rfr("load.js");

let logProcess = function(value) {
	let ticks = Math.round( performance.now() );
	console.log(`[${ticks} ms] PROCESS: ${value}`);
}

let run = function(filename, code, flags) {
	let showProcess = flags.includes("--show-process");
	let showLexer = flags.includes("--lexer");
	let showParser = flags.includes("--parser");
	let showInterp = flags.includes("--rtvalue");
	let showVarTable = flags.includes("--var-table");
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
	if (showProcess) logProcess("creating variable table...");
	let varTable = new VariableTable();
	loadVarTable(varTable);

	if (showProcess) logProcess("interpreting...");
	let interp = new Interpreter(filename);
	let result = interp.evalPrimary(ast.node, varTable);

	// Checking interpreter error
	if (result.error) {
		console.log(result.error.asString());
		return;
	}

	// Output last evaluated value
	if (showInterp)
		console.log(result.value);

	// Output the variable table
	if (showVarTable)
		console.log(utils.inspect(varTable.table, {showHidden: false, depth: null, colors: true}));
}

module.exports = run;