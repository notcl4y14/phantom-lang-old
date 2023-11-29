let Error = require("../error.js");
let VariableTable = require("./variabletable.js");

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

	// ---------------------------------------------------------------------------

	toBoolean(value) {
		if (!value) return;

		if (value.type == "boolean")
			return value.value;

		return
			!(value.type === "undefined"
			|| value.type === "null"
			|| (value.type === "boolean" && value.value === false));
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

	// ---------------------------------------------------------------------------

	evalPrimary(node, varTable) {
		let res = new RuntimeResult();

		if (["number", "string", "boolean", "null", "undefined"].includes(node.type))
			return res.success(node);

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

		} else if (node.type == "identifier") {
			let variable = varTable.lookup(node.value);
			return variable ? res.success(variable) : res.success({type: "undefined", value: null});

		// ---------------------------------------------------------------------------

		// values
		} else if (node.type == "array-literal") {
			return this.evalArrayLiteral(node, varTable);

		// Misc.
		} else if (node.type == "program") {
			return this.evalProgram(node, varTable);

		// Statements
		} else if (node.type == "if-statement") {
			return this.evalIfStatement(node, varTable);

		} else if (node.type == "block-statement") {
			return this.evalBlockStatement(node, varTable);

		} else if (node.type == "var-declaration") {
			return this.evalVarDeclaration(node, varTable);

		// expressions
		} else if (node.type == "var-assignment") {
			return this.evalVarAssignment(node, varTable);

		} else if (node.type == "logical-expr") {
			return this.evalLogicalExpr(node, varTable);

		} else if (node.type == "binary-expr") {
			return this.evalBinaryExpr(node, varTable);

		} else if (node.type == "unary-expr") {
			return this.evalUnaryExpr(node, varTable);
		}

		return res.failure(this.filename, node.rightPos, `Node Type ${node.type} has not been setup for interpretation`);
	}

	// ---------------------------------------------------------------------------

	// ---------------------------------------------------------------------------
	// Values
	// ---------------------------------------------------------------------------
	evalArrayLiteral(node, varTable) {
		let res = new RuntimeResult();
		let values = [];

		node.values.forEach((node) => {

			let value = res.register(
				this.evalPrimary(node, varTable));
			if (res.error) return res;
			values.push(value);

		});

		if (res.error) return res;
		return res.success({type: "array", values: values});
	}

	// ---------------------------------------------------------------------------
	// Misc.
	// ---------------------------------------------------------------------------
	evalProgram(program, varTable) {
		let res = new RuntimeResult();

		let body = program.body;
		let lastEvalValue = null;

		for (let node of body) {
			lastEvalValue = res.register(this.evalPrimary(node, varTable));
			if (res.error) return res;
		}

		return res.success(lastEvalValue);
	}

	// ---------------------------------------------------------------------------
	// Statements
	// ---------------------------------------------------------------------------
	evalIfStatement(node, varTable) {
		let res = new RuntimeResult();

		let block = node.block;
		let condition = res.register(this.evalPrimary(node.condition, varTable));
		if (res.error) return res;

		let isCondTrue = this.toBoolean(condition);
		if (!isCondTrue) {

			if (node.alternate) {
				let lastEvalValue = res.register(this.evalPrimary(node.alternate, varTable));
				if (res.error) return res;
				return res.success(lastEvalValue);
			}

			return res.success();
		}

		let lastEvalValue = res.register(this.evalPrimary(block, varTable));
		if (res.error) return res;

		return res.success(lastEvalValue);
	}

	evalBlockStatement(node, varTable) {
		let res = new RuntimeResult();
		let body = node.body;

		let lastEvalValue;

		body.forEach((node) => {

			lastEvalValue = res.register(
				this.evalPrimary(node, varTable));
			if (res.error) return res;

		});

		if (res.error) return res;
		return res.success(lastEvalValue);
	}

	evalVarDeclaration(node, varTable) {
		let res = new RuntimeResult();

		let name = node.name.value;
		let value = res.register(this.evalPrimary(node.value, varTable));
		if (res.error) return res;

		let variable = varTable.declare(name, value);

		if (!variable)
			return res.failure(this.filename, node.name.rightPos, `Variable '${name}' cannot be redeclared`);

		return res.success(variable);
	}

	// ---------------------------------------------------------------------------
	// Expressions
	// ---------------------------------------------------------------------------
	evalVarAssignment(node, varTable) {
		let res = new RuntimeResult();

		let name = node.name.value;
		let value = res.register(this.evalPrimary(node.value, varTable));

		let variable = varTable.set(name, value);

		if (!variable)
			return res.failure(this.filename, node.name.rightPos, `Variable '${name}' does not exist`);

		return res.success(variable);
	}

	evalLogicalExpr(node, varTable) {
		let res = new RuntimeResult();

		let left = res.register(this.evalPrimary(node.left, varTable));
		if (res.error) return res;

		let right = res.register(this.evalPrimary(node.right, varTable));
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

	evalBinaryExpr(node, varTable) {
		let res = new RuntimeResult();

		let left = res.register(this.evalPrimary(node.left, varTable));
		if (res.error) return res;

		let right = res.register(this.evalPrimary(node.right, varTable));
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

	evalUnaryExpr(node, varTable) {
		let res = new RuntimeResult();

		let argument = res.register(this.evalPrimary(node.argument, varTable));
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