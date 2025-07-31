function greet() {
	return "Hello, Jenkins!";
}

module.exports = { greet };

if (require.main === module) {
	console.log(greet());
}
