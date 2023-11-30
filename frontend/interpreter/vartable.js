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
		if (!this.table[name]) {
			if (this.parent.lookup(name)) 
				return this.parent.set(name, value);

			return;
		}

		this.table[name] = value;
		return this.lookup(name);
	}

	lookup(name) {
		if (!this.table[name]) {
			if (this.parent)
				return this.parent.lookup(name);

			return;
		}

		return this.table[name];
	}
}

module.exports = VariableTable;