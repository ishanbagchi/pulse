const jwt = require('jsonwebtoken')
const User = require('../models/User')
const config = require('../config')

const authenticate = async (req, res, next) => {
	try {
		let token
		const authHeader = req.headers.authorization
		if (authHeader && authHeader.startsWith('Bearer ')) {
			token = authHeader.split(' ')[1]
		} else if (req.query.token) {
			token = req.query.token
		}

		if (!token) {
			return res.status(401).json({ error: 'Authentication required' })
		}

		const decoded = jwt.verify(token, config.jwt.secret)
		const user = await User.findById(decoded.userId)

		if (!user) {
			return res.status(401).json({ error: 'User not found' })
		}

		req.user = user
		next()
	} catch (error) {
		if (
			error.name === 'JsonWebTokenError' ||
			error.name === 'TokenExpiredError'
		) {
			return res.status(401).json({ error: 'Invalid or expired token' })
		}
		next(error)
	}
}

const authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ error: 'Insufficient permissions' })
		}
		next()
	}
}

module.exports = { authenticate, authorize }
