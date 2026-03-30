const config = require('../config')

const errorHandler = (err, req, res, _next) => {
	if (config.nodeEnv !== 'production') {
		console.error('Error:', err.stack || err.message)
	}

	if (err.name === 'ValidationError') {
		const messages = Object.values(err.errors).map((e) => e.message)
		return res
			.status(400)
			.json({ error: 'Validation failed', details: messages })
	}

	if (err.code === 11000) {
		const field = Object.keys(err.keyValue)[0]
		return res.status(409).json({ error: `${field} already exists` })
	}

	if (err.name === 'CastError') {
		return res.status(400).json({ error: 'Invalid ID format' })
	}

	if (err.message?.includes('Invalid file type')) {
		return res.status(400).json({ error: err.message })
	}

	if (err.code === 'LIMIT_FILE_SIZE') {
		return res
			.status(400)
			.json({ error: 'File size exceeds maximum limit' })
	}

	const statusCode = err.statusCode || 500
	res.status(statusCode).json({
		error: statusCode === 500 ? 'Internal server error' : err.message,
	})
}

module.exports = errorHandler
