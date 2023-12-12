let utils = require("util");

let toBoolean = function(value) {
	if (!value) return;

	else if (value.type == "boolean")
		return value.value;

	return !(["undefined", "null"].includes(value.type));
}

let toNumber = function(value) {
	if (!value) return;

	else if (value.type == "number") {
		return value.value;

	} else if (
		["undefined", "null"].includes(value.type)
		|| (value.type === "boolean" && value.value === false))
	{
		return 0;
	}

	return 1;
}

getValue = function(value) {
	if (!value) {
		return;
	} else if (["undefined", "null"].includes(value.type)) {
		return value.type;
	} else if (value.type == "array") {
        return value.values;
    } else if (value.type == "object") {
        // TODO: Rewrite this
        return utils.inspect(value.properties, {showHidden: false, depth: null, colors: true});
    }

	return value.value;
}

module.exports = {toBoolean, toNumber, getValue};