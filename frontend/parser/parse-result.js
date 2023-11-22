let Error = require("../error.js");

let ParseResult = class {
	constructor() {
		this.node = null;
		this.error = null;
	}

	register(res) {
		if (res.error) this.error = res.error;
		return res.node;
	}

	success(node) {
		this.node = node;
		return this;
	}

	failure(filename, position, details) {
		this.error = new Error(filename, position, details);
		return this;
	}
}

module.exports = ParseResult;