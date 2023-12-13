let rfr = require("rfr");
let runtime = rfr("frontend/interpreter/runtime.js");

/**
 *  let loadSymbols = function(table) {
 *		let varTable = {};
 *
 *		for (let { name, value } of table) {
 *			varTable[name] = value;
 *		}
 *  }
 **/

let loadVarTable = function(varTable) {
	varTable.declare("log", {type: "object", properties: {
		"write": {type: "native-function", call: function(args, varTable) {
		    let value = runtime.getValue(args[0]);
			process.stdout.write(value);
            return {type: "undefined", value: null};
		}},

		"writeln": {type: "native-function", call: function(args, varTable) {
			let value = runtime.getValue(args[0]);
			process.stdout.write(value + "\n");
            return {type: "undefined", value: null};
		}},
	}});
}

module.exports = loadVarTable;