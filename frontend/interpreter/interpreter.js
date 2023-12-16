let rfr = require("rfr");
let Environment = rfr("frontend/interpreter/environment.js");
let runtime = rfr("frontend/interpreter/runtime.js");
let Error = rfr("frontend/error.js");

let RuntimeResult = class {
	constructor(filename = null) {
		this.filename = filename;
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

	failure(details, position) {
		this.error = new Error(this.filename, position, details);
		return this;
	}
}

let Interpreter = class {
	constructor(filename) {
		this.filename = filename;
	}

	// ---------------------------------------------------------------------------

	eval_primary(node, env) {
		let res = new RuntimeResult(this.filename);
		if (!node) return res.success();

		if (["number", "string", "boolean", "null", "undefined"].includes(node.type))
			return res.success(node);

		switch (node.getType()) {
			case "NumericLiteral":
				return res.success({
					type: "number",
					value: node.value
				});

			case "StringLiteral":
				return res.success({
					type: "string",
					value: node.value
				});

			case "Literal":
				if (["true", "false"].includes(node.value))
					return res.success({
						type: "boolean",
						value: node.value == "true"
					});

				return res.success({type: node.value, value: null});

			case "Identifier":
				let variable = env.lookup(node.value);
				return variable
					? res.success(variable)
					: res.failure(`Variable '${node.value}' does not exist`, node.position);

			// ---------------------------------------------------------------------------

			// Values
			case "ArrayLiteral":
				return this.eval_arrayLiteral(node, env);

			case "ObjectLiteral":
				return this.eval_objectLiteral(node, env);

			// Misc.
			case "Program":
				return this.eval_program(node, env);

			// Statements
			case "FunctionStatement":
				return this.eval_functionStatement(node, env);

			case "IfStatement":
				return this.eval_ifStatement(node, env);

			case "WhileStatement":
				return this.eval_whileStatement(node, env);

			case "BlockStatement":
				return this.eval_blockStatement(node, env);

			case "VarDeclaration":
				return this.eval_varDeclaration(node, env);

			// Expressions
			case "VarAssignment":
				return this.eval_varAssignment(node, env);
			
			case "MemberExpr":
				return this.eval_memberExpr(node, env);
				
			case "CallExpr":
				return this.eval_callExpr(node, env);

			case "LogicalExpr":
				return this.eval_logicalExpr(node, env);

			case "BinaryExpr":
				return this.eval_binaryExpr(node, env);

			case "UnaryExpr":
				return this.eval_unaryExpr(node, env);
		}

		return res.failure(`Node Type ${node.type} has not been setup for interpretation`, node.position);
	}

	// ---------------------------------------------------------------------------

	// ---------------------------------------------------------------------------
	// Values
	// ---------------------------------------------------------------------------
	eval_arrayLiteral(node, env) {
		let res = new RuntimeResult(this.filename);
		let values = [];

		node.values.forEach((node) => {

			let value = res.register(
				this.evalPrimary(node, env));
			if (res.error) return res;
			values.push(value);

		});

		if (res.error) return res;
		return res.success({type: "array", values: values});
	}

	eval_objectLiteral(node, env) {
		let res = new RuntimeResult(this.filename);
		let properties = {};

		node.properties.forEach((property) => {

			let value = (property.value == undefined)
				? env.lookup(property.key)
				: res.register(this.evalPrimary(property.value, env));

			if (res.error) return res;
			properties[property.key] = value;

			// TODO: Change the position range here
			if (!value) return res.failure(`Variable '${property.key}' does not exist`,
				[property.leftPos, property.rightPos]);

		});

		if (res.error) return res;
		return res.success({type: "object", properties: properties});
	}

	// ---------------------------------------------------------------------------
	// Misc.
	// ---------------------------------------------------------------------------
	eval_program(program, env) {
		let res = new RuntimeResult(this.filename);

		let body = program.body;
		let lastEvalValue = null;

		for (let node of body) {
			lastEvalValue = res.register(this.evalPrimary(node, env));
			if (res.error) return res;
		}

		return res.success(lastEvalValue);
	}

	// ---------------------------------------------------------------------------
	// Statements
	// ---------------------------------------------------------------------------
	eval_functionStatement(node, env) {
		let res = new RuntimeResult(this.filename);

		let interpreter = this;

		let name = node.name.value;
		let params = node.params;
		let body = node.block.body;

		let call = function(args, env) {
			let res = new RuntimeResult(interpreter.filename);
			let lastEvalValue = null;

			for (let node of this.body) {
				lastEvalValue = res.register(interpreter.evalPrimary(node, env));
				if (res.error) return res;
			}

			return res.success(lastEvalValue);
		}

		let func = env.declare(name, {
			type: "function",
			params: params,
			env: env,
			body: body,
			call: call
		});

		return res.success(func);
	}

	eval_ifStatement(node, env) {
		let res = new RuntimeResult(this.filename);

		let block = node.block;
		let condition = res.register(this.evalPrimary(node.condition, env));
		if (res.error) return res;

		let isCondTrue = runtime.toBoolean(condition);
		if (!isCondTrue) {

			if (node.alternate) {
				let lastEvalValue = res.register(this.evalPrimary(node.alternate, env));
				if (res.error) return res;
				return res.success(lastEvalValue);
			}

			return res.success();
		}

		let lastEvalValue = res.register(this.evalPrimary(block, env));
		if (res.error) return res;

		return res.success(lastEvalValue);
	}

	eval_whileStatement(node, env) {
		let res = new RuntimeResult(this.filename);

		let block = node.block;
		let condition = res.register(this.evalPrimary(node.condition, env));
		if (res.error) return res;

		let lastEvalValue;
		let isCondTrue = runtime.toBoolean(condition);

		while (isCondTrue) {
			lastEvalValue = res.register(this.evalPrimary(block, env));
			if (res.error) return res;

			condition = res.register(this.evalPrimary(node.condition, env));
			isCondTrue = runtime.toBoolean(condition);
			if (!isCondTrue) break;
		}

		return res.success(lastEvalValue);
	}

	eval_blockStatement(node, env) {
		let res = new RuntimeResult(this.filename);
		let body = node.body;
		let _env = new Environment(env);

		let lastEvalValue;

		body.forEach((node) => {

			lastEvalValue = res.register(
				this.evalPrimary(node, _env));
			if (res.error) return res;

		});

		if (res.error) return res;
		return res.success(lastEvalValue);
	}

	eval_varDeclaration(node, env) {
		let res = new RuntimeResult(this.filename);

		let name = node.name.value;
		let value = res.register(this.evalPrimary(node.value, env));
		if (res.error) return res;

		let variable = env.declare(name, value);
		if (!variable) return res.failure(`Variable '${name}' cannot be redeclared`,
			[node.name.leftPos, node.name.rightPos]);

		return res.success(variable);
	}

	// ---------------------------------------------------------------------------
	// Expressions
	// ---------------------------------------------------------------------------
	eval_varAssignment(node, env) {
		let res = new RuntimeResult(this.filename);

		let name = node.name.value;
		let value;

		let left = env.lookup(name);
		if (!left) return res.failure(`Variable '${name}' does not exist`, node.name.rightPos);

		let right = res.register(this.evalPrimary(node.value, env));
		if (res.error) return res;

		switch (node.operator) {
			case "=": value = right.value; break;
			case "+=": value = left.value + right.value; break;
			case "-=": value = left.value - right.value; break;
			case "*=": value = left.value * right.value; break;
			case "/=": value = left.value / right.value; break;
		}

		value = {type: left.type, value: value};
		let variable = env.set(name, value);
		if (!variable) return res.failure(`Variable '${name}' does not exist`,
			[node.name.leftPos, node.name.rightPos]);

		return res.success(variable);
	}

	eval_memberExpr(node, env) {
		let res = new RuntimeResult(this.filename);
		let object = res.register(this.evalPrimary(node.object, env));
		if (res.error) return res;
		
		// let property = res.register(this.evalPrimary(node.property, env));
		// if (res.error) return res;
		let property = node.property;
		let output = null;

		switch (object.type) {
			case "array": output = object.values[property.value]; break;
			case "object": output = object.properties[property.value]; break;
			default:
				let type = object.type;
				let leftPos = object.leftPos, rightPos = object.rightPos;
				return res.failure(`Cannot access properties in ${type}`, [leftPos, rightPos]);
		}

		// If an array | object does not have a value
		if (!output) {
			return res.success({type: "undefined", value: null});
		}

		return res.success(output);
	}

	eval_callExpr(node, env) {
		let res = new RuntimeResult(this.filename);

		let args = [];
		for (let arg of node.args) {
			let argEval = res.register(this.evalPrimary(arg, env));
			if (res.error) return res;
			args.push(argEval);
		}

		let func = res.register(this.evalPrimary(node.caller, env));
		if (res.error) return res;

		// native function
		if (func.type == "native-function") {
			let result = res.register(func.call(args, env)) || {type: "undefined", value: null};
			if (res.error) return res;

			return res.success(result);

		// user-defined function
		} else if (func.type == "function") {
			let scope = new Environment(func.env);

			// creating variables from the parameters
			for (let i = 0; i < func.params.length; i += 1) {
				let variable = func.params[i];
				scope.declare(variable.value, args[i]);
			}

			let result = {type: "undefined", value: null};
			for (let stmt of func.body) {
				result = res.register(this.evalPrimary(stmt, scope));
				if (res.error) return res;
			}

			return res.success(result);
		}

		// TODO: Change position range here
		return res.failure(`Cannot call a value type of ${func.type}`,
			[{line: undefined, column: undefined}, {line: undefined, column: undefined}]);
	}

	eval_logicalExpr(node, env) {
		let res = new RuntimeResult(this.filename);

		let left = res.register(this.evalPrimary(node.left, env));
		if (res.error) return res;

		let right = res.register(this.evalPrimary(node.right, env));
		if (res.error) return res;

		let operator = node.operator;
		let result = null;

		switch (operator) {
			case "&&":
				result = runtime.toBoolean(left) && runtime.toBoolean(right);
				break;

			// TODO: Make another operator or || operator to choose values like
			// let y = x || 10;
			case "||":
				result = runtime.toBoolean(left) || runtime.toBoolean(right);
				break;
			default:
				return res.failure(`Undefined logical expression operator '${operator}'`, [node.leftPos, node.rightPos]);
		}

		return res.success({type: "boolean", value: result});
	}

	eval_binaryExpr(node, env) {
		let res = new RuntimeResult(this.filename);

		let left = res.register(this.evalPrimary(node.left, env));
		if (res.error) return res;

		let right = res.register(this.evalPrimary(node.right, env));
		if (res.error) return res;

		let operator = node.operator;
		let result = null;

		switch (operator) {
			// Arithmetic operators
			case "+":
				result = runtime.toNumber(left) + runtime.toNumber(right);
				break;
			case "-":
				result = runtime.toNumber(left) - runtime.toNumber(right);
				break;
			case "*":
				result = runtime.toNumber(left) * runtime.toNumber(right);
				break;
			case "/":
				result = runtime.toNumber(left) / runtime.toNumber(right);
				break;
			case "%":
				result = runtime.toNumber(left) % runtime.toNumber(right);
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
			return res.failure(`Undefined binary expression operator '${operator}'`, [node.leftPos, node.rightPos]);

		if (result === true || result === false)
			return res.success({type: "boolean", value: result});

		return res.success({type: left.type, value: result});
	}

	eval_unaryExpr(node, env) {
		let res = new RuntimeResult(this.filename);

		let argument = res.register(this.evalPrimary(node.argument, env));
		if (res.error) return res;

		let operator = node.operator;
		let result = null;

		switch (operator) {
			case "-":
				result = argument.value * -1;
				break;
			case "!":
				result = !(runtime.toBoolean(argument.value));
				break;
		}

		if (result == null)
			return res.failure(`Undefined unary expression operator '${operator}'`, [node.leftPos, node.rightPos]);

		if (result === true || result === false)
			return res.success({type: "boolean", value: result});

		return res.success({type: argument.type, value: result});
	}
}

module.exports = Interpreter;