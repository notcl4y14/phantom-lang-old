let ParseResult = class {
	constructor() {
		this.node = null;
		this.error = null;
	}

	register(res) {
		if (res instanceof ParseResult) {
			if (res.error) return res;
			return res.node;
		}

		return res;
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