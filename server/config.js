module.exports = {
	db: 'localhost',
	code: 'e050804d381c91598c61',
	clientId: 'a97bc9fc45e8b4bb20f8',
	clientSecret: process.env.clientSecret|| '5fa3078401109957ba8dd41440c8d675e61ed9e2',
	tokenSecret: process.env.tokenSecret || 'pick a hard string to guess',
	MONGO_URI: process.env.MONGO_URI || 'mongodb://test:test@ds043002.mongolab.com:43002/uptake-github',
};