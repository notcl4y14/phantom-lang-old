let fs = require("fs");
let run = require("./run.js");

// Outputs the initialization error
let initError = function(value) {
	console.error(value);
	return;
}

let validArguments = [
	"--show-process",
	"--lexer",
	"--parser",
	"--rtvalue",
	"--var-table"
];

let main = function() {
	let args = process.argv;
	args.splice(0, 2);

	// Initializing variables
	let filename = "";
	let inputArgs = [];

	// Iterating through arguments
	for (let i = 0; i < args.length; i += 1) {
		let argument = args[i];

		// Check if an argument starts with "-"
		if (argument[0] == "-") {
			
			// Check if an argument is valid
			// Otherwise, return an error :P
			if (!validArguments.includes(argument))
				return initError(`Undefined argument ${argument}`);

			inputArgs.push(argument);
			continue;
		}

		// Check if the filename is already specified
		if (filename)
			return initError("Filename already specified!");

		// Set the filename
		filename = argument;
	}

	// Check if filename isn't specified
	if (!filename)
		return initError("Please specify a filename!");

	fs.readFile(filename, "utf-8", (error, code) => {
		// File doesn't exist
		if (error)
			return initError(`${filename} doesn't exist!`);

		run(filename, code, inputArgs);
	});

	// run("<stdin>", "let x = function() {};", inputArgs);
}
main();