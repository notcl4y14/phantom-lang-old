# phantom-lang

# TODO
- Make the ability to reuse additive and multiplicative expr like (10 + 4 - 10 + 5)
	+ Right now it's possible to do that via parenthesised expressions like (10 - 5) + 10
- Decide should a copied value have a reference automatically
	```ts
	let x = 5;
	let y = x;
	y = 10;
	// x: 10
	// y: 10
	```
	+ Add an operator that would copy a value without a reference
		```ts
		let x = 5;
		let y = &x;
		y = 10;
		// x: 5
		// y: 10
		```
	+ Add an operator that would synchronize both original and copied value
		```ts
		let x = 5;
		let y = *x;
		y = 10;
		// x: 10
		// y: 10
		x = 20;
		// x: 20
		// y: 20
		```
		* Can be used for short handling like from `Window.Canvas` to `let canvas = *Window.Canvas;`
