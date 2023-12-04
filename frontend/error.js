let Error = class {
	constructor(filename, pos, details) {
		this.filename = filename;
		this.pos = pos;
		this.details = details;
	}

	asString() {
		let	filename	= this.filename,
			leftPos		= this.pos[0],
			rightPos	= this.pos[1],
			details		= this.details;

		// How, just how
		// Does it work like (condition ? ifTrue : ifFalse)?
		// If it does, it's just me or it somehow is reversed here
		// Nvm, it works now
		let	line	= this.pos[0].line != this.pos[1].line
				? `${this.pos[0].line + 1}-${this.pos[1].line + 1}`
				: `${this.pos[0].line + 1}`,

			column	= this.pos[0].column != this.pos[1].column
				? `${this.pos[0].column + 1}-${this.pos[1].column + 1}`
				: `${this.pos[0].column + 1}`;

		return `${filename}: ${line} : ${column} : ${details}`;
	}
}

module.exports = Error;