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

	toBoolean(value) {
		if (!value) return;

		return (
				!(value.type === "undefined"
				|| value.type === "null"
				|| (value.type === "boolean" && value.value === false)));
	}

	toNumber(value) {
		if (!value) return;

		if (value.type == "number") {
			return value.value;

		} else if (
			["undefined", "null"].includes(value.type)
			|| (value.type === "boolean" && value.value === false))
		{
			return 0;
		}

		return 1;
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

		} else if (node.type == "logical-expr") {
			return this.evalLogicalExpr(node);

		} else if (node.type == "binary-expr") {
			return this.evalBinaryExpr(node);

		} else if (node.type == "unary-expr") {
			return this.evalUnaryExpr(node);
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

	evalLogicalExpr(node) {
		let res = new RuntimeResult();

		let left = res.register(this.evalPrimary(node.left));
		if (res.error) return res;

		let right = res.register(this.evalPrimary(node.right));
		if (res.error) return res;

		let operator = node.operator;
		let result = null;

		switch (operator) {
			case "&&":
				result = this.toBoolean(left) && this.toBoolean(right);
				break;
			case "||":
				result = this.toBoolean(left) || this.toBoolean(right);
				break;
			default:
				return res.failure(this.filename, node.leftPos, `Undefined logical expression operator '${operator}'`);
		}

		return res.success({type: "boolean", value: result});
	}

	evalBinaryExpr(node) {
		let res = new RuntimeResult();

		let left = res.register(this.evalPrimary(node.left));
		if (res.error) return res;

		let right = res.register(this.evalPrimary(node.right));
		if (res.error) return res;

		let operator = node.operator;
		let result = null;

		switch (operator) {
			// Arithmetic operators
			case "+":
				result = this.toNumber(left) + this.toNumber(right);
				break;
			case "-":
				result = this.toNumber(left) - this.toNumber(right);
				break;
			case "*":
				result = this.toNumber(left) * this.toNumber(right);
				break;
			case "/":
				result = this.toNumber(left) / this.toNumber(right);
				break;
			case "%":
				result = this.toNumber(left) % this.toNumber(right);
				break;

			// Comparisonal operators
			case "<":
				result = left.value < right.value;
				break;
			case ">":
				result = left.value > right.value;
				break;
			case "<=":
				result = left.value <= right.value;
				break;
			case ">=":
				result = left.value >= right.value;
				break;
			case "==":
				result = left.value == right.value && left.type == right.type;
				break;
			case "!=":
				result = left.value != right.value;
				break;
		}

		if (result == null)
			return res.failure(this.filename, node.leftPos, `Undefined binary expression operator '${operator}'`);

		if (result === true || result === false)
			return res.success({type: "boolean", value: result});

		return res.success({type: "number", value: result});
	}

	evalUnaryExpr(node) {
		let res = new RuntimeResult();

		let argument = res.register(this.evalPrimary(node.argument));
		if (res.error) return res;

		let operator = node.operator;
		let result = null;

		switch (operator) {
			case "-":
				result = argument.value * -1;
				break;
			case "!":
				result = !(this.toBoolean(argument.value));
				break;
		}

		if (result == null)
			return res.failure(this.filename, node.leftPos, `Undefined unary expression operator '${operator}'`);

		if (result === true || result === false)
			return res.success({type: "boolean", value: result});

		return res.success({type: "number", value: result});
	}
}

module.exports = Interpreter;