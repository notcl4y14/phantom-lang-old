let rfr = require("rfr");
let Node = rfr("frontend/parser/node.js");
let n = {};

/* Misc. */
n.Program = class extends Node {
	constructor() {
		super();
		this.body = [];
		this.comments = [];
	}
}

n.Property = class extends Node {
	constructor(key, value) {
		super();
		this.key = key;
		this.value = value;
	}
}

/* Literals */
n.NumericLiteral = class extends Node {
	constructor(value) {
		super();
		this.value = value;
	}
}

n.StringLiteral = class extends Node {
	constructor(value) {
		super();
		this.value = value;
	}
}

n.Literal = class extends Node {
	constructor(value) {
		super();
		this.value = value;
	}
}

n.Identifier = class extends Node {
	constructor(value) {
		super();
		this.value = value;
	}
}

n.ObjectLiteral = class extends Node {
	constructor(properties) {
		super();
		this.properties = properties;
	}
}

n.Array = class extends Node {
	constructor(values) {
		super();
		this.values = values;
	}
}

/* Statements */
n.VarDeclaration = class extends Node {
	constructor(declarations) {
		super();
		this.declarations = declarations;
	}
}

n.VarDeclarator = class extends Node {
	constructor(ident, value) {
		super();
		this.ident = ident;
		this.value = value;
	}
}

n.FunctionDeclaration = class extends Node {
	constructor(ident, params, block) {
		super();
		this.ident = ident;
		this.params = params;
		this.block = block;
	}
}

n.WhileStatement = class extends Node {
	constructor(condition, block) {
		super();
		this.condition = condition;
		this.block = block;
	}
}

n.BlockStatement = class extends Node {
	constructor(body) {
		super();
		this.body = body;
	}
}

/* Expressions */
n.CallExpr = class extends Node {
	constructor(caller, args) {
		super();
		this.caller = caller;
		this.args = args;
	}
}

n.MemberExpr = class extends Node {
	constructor(object, property, computed) {
		super();
		this.object = object;
		this.property = property;
		this.computed = computed;
	}
}

n.BinaryExpr = class extends Node {
	constructor(left, operator, right) {
		super();
		this.left = left;
		this.operator = operator;
		this.right = right;
	}
}

n.CommentExpr = class extends Node {
	constructor(value) {
		super();
		this.value = value;
	}
}

n.UnaryExpr = class extends Node {
	constructor(operator, argument) {
		super();
		this.operator = operator;
		this.argument = argument;
	}
}

n.VarAssignment = class extends Node {
	constructor(ident, value, operator) {
		super();
		this.ident = ident;
		this.value = value;
		this.operator = operator;
	}
}

n.FunctionExpression = class extends Node {
	constructor(params, block) {
		super();
		this.ident = null;
		this.params = params;
		this.block = block;
	}
}

module.exports = n;