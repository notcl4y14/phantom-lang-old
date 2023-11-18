// let Token = require("./frontend/token.js");
let Lexer = require("./frontend/lexer/lexer.js");

let main = function() {
	console.log("Hello World!");
	// let token = new Token("string", "lol");
	// console.log(token);
	let lexer = new Lexer("+-*/%");
	let tokens = lexer.lexerize();
	console.log(tokens);
}
main();