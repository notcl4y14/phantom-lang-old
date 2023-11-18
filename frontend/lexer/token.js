let Token = class {
	constructor(type, value) {
		this.type = type;
		this.value = value;
	}

	matches(type, value) {
		return
			(this.type == type
			&& this.value == value);
	}
}

module.exports = Token;