let Error = require("../error.js");

let RuntimeResult = class {
	constructor() {
		this.value = null;
		this.error = null;
	}

	register(res) {
		if (res.error) this.error = res.error;
		return res.value;
	}

	success(value) {
		this.value = value;
		return this;
	}

	failure(filename, position, details) {
		this.error = new Error(filename, position, details);
		return this;
	}
}

let Interpreter = class {
	constructor(filename) {
		this.filename = filename;
	}

	evalPrimary(node) {
		let res = new RuntimeResult();

		if (node.type == "numeric-literal") {
			return res.success({
				type: "number",
				value: node.value
			});

		} else if (node.type == "string-literal") {
			return res.success({
				type: "string",
				value: node.value
			});

		} else if (node.type == "literal") {
			if (["true", "false"].includes(node.value))
				return res.success({
					type: "boolean",
					value: node.value == "true"
				});

			return res.success({type: node.value, value: null});

		} else if (node.type == "program") {
			return this.evalProgram(node);

		} else if (node.type == "binary-expr") {
			return this.evalBinaryExpr(node);
		}

		return res.failure(this.filename, node.rightPos, `Node Type ${node.type} has not been setup for interpretation`);
	}

	evalProgram(program) {
		let res = new RuntimeResult();

		let body = program.body;
		let lastEvalValue = null;

		for (let node of body) {
			lastEvalValue = res.register(this.evalPrimary(node));
			if (res.error) return res;
		}

		return res.success(lastEvalValue);
	}

	evalBinaryExpr(node) {
		let res = new RuntimeResult();

		let left = res.register(this.evalPrimary(node.left));
		if (res.error) return res;

		let right = res.register(this.evalPrimary(node.right));
		if (res.error) return res;

		let operator = node.operator;
		let result = 0;

		switch (operator.value) {
			case "+":
				result = left.value + right.value;
				break;
			case "-":
				result = left.value - right.value;
				break;
			case "*":
				result = left.value * right.value;
				break;
			case "/":
				result = left.value / right.value;
				break;
			case "%":
				result = left.value % right.value;
				break;
		}

		return res.success({type: "number", value: result});
	}
}

module.exports = Interpreter;