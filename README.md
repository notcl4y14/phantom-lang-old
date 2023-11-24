# whisp-lang

# TODO
- Make the code cleaner
	+ Make the name convention rules (This might be a problem due to my liking and unliking of some capital and lowercase letters)
		* ~~Somehow avoid snake_case for classes, functions and variables like in lexer.js~~
- Rename the lexer token types to something else if possible
- Find a way to set the module source location so instead of like `require("../../frontend/lexer/lexer.js");` you could do `require("frontend/lexer/lexer.js");`
- Make the ability to reuse additive and multiplicative expr like (10 + 4 - 10 + 5)
	+ Right now it's possible to do that via parenthesised expressions like (10 - 5) + 10
- Probably make changelog.txt