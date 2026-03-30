require('dotenv').config()

if (!process.env.JWT_SECRET) {
	console.error('FATAL: JWT_SECRET environment variable is required')
	process.exit(1)
}

module.exports = {
	port: parseInt(process.env.PORT, 10) || 5000,
	mongoUri:
		process.env.MONGODB_URI || 'mongodb://localhost:27017/pulse-video',
	jwt: {
		secret: process.env.JWT_SECRET,
		expiresIn: process.env.JWT_EXPIRES_IN || '7d',
	},
	uploadDir: process.env.UPLOAD_DIR || 'uploads',
	maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 524288000,
	corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	nodeEnv: process.env.NODE_ENV || 'development',
}
