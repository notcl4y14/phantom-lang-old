let VariableTable = class {
	constructor(parent = null) {
		this.table = {};
		this.parent = parent;
	}

	declare(name, value) {
		if (this.table[name])
			return;

		this.table[name] = value;
		return this.lookup(name);
	}

	set(name, value) {
		if (!this.table[name])
			return;

		this.table[name] = value;
		return this.lookup(name);
	}

	lookup(name) {
		if (!this.table[name])
			return;

		return this.table[name];
	}
}

module.exports = VariableTable;