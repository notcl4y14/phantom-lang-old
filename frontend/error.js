let Error = class {
	constructor(filename, pos, details) {
		this.filename = filename;
		this.pos = pos;
		this.details = details;
	}

	asString() {
		let	filename	= this.filename,
			line		= this.pos.line,
			column		= this.pos.column,
			details		= this.details;

		return `${filename}:${line}:${column}: ${details}`;
	}
}

module.exports = Error;