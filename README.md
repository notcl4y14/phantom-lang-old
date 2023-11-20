# whisp-lang

# TODO
- Make the code cleaner
	+ Make the name convention rules (This might be a problem due to my liking and unliking of some capital and lowercase letters)
		* ~~Somehow avoid snake_case for classes, functions and variables like in lexer.js~~
- Rename the lexer token types to something else if possible
- Find a way to set the module source location so instead of like `require("../../frontend/lexer/lexer.js");` you could do `require("frontend/lexer/lexer.js");`

# API

## Lexer Token Types
- `type`: Defines the token type name, however only used to specify in what type there is an error
- `find`: Defines its first character to find
- `flags`: Special properties for different methods of managing the type
	+ "ignore": Ignore the token and do not add it to the tokens list
	+ "one-char": The token can be only one value and does not need the `lexerize()` method
	+ "multi-char": The token is more than one character, which applies to the `find` property
- `lexerize(lexer: Lexer)`: A function for managing the token. It can be not used when the token has "ignore" or "one-char" flag
	+ `lexer: Lexer`: The lexer instance