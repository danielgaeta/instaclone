module.exports = {
	db: 'localhost',
	clientSecret: process.env.clientSecret|| '2fb9958ef79345408cf0890f1995aa26',
	tokenSecret: process.env.tokenSecret || 'pick a hard string to guess',
	MONGO_URI: process.env.MONGO_URI || 'mongodb://test:test@ds031962.mongolab.com:31962/instaclone',
};