let run = require("./run.js");

let main = function() {
	run("<stdin>", "10.2+5 - 3248972348", ["--lexer"]);
}
main();