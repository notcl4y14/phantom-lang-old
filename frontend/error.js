let Error = class {
	constructor(filename, pos, details) {
		this.filename = filename;
		this.pos = pos;
		this.details = details;
	}

	asString() {
		let	filename	= this.filename,
			line		= this.pos.line + 1,
			column		= this.pos.column + 1,
			details		= this.details;

		return `${filename}:${line}:${column}: ${details}`;
	}
}

module.exports = Error;