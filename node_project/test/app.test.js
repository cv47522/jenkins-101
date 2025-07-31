const { greet } = require("../index");

test('greet() returns "Hello, Jenkins!"', () => {
	expect(greet()).toBe("Hello, Jenkins!");
});
