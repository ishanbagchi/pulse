const jwt = require('jsonwebtoken')
const config = require('../config')

const setupSocket = (io) => {
	io.use((socket, next) => {
		const token = socket.handshake.auth?.token
		if (!token) {
			return next(new Error('Authentication required'))
		}

		try {
			const decoded = jwt.verify(token, config.jwt.secret)
			socket.userId = decoded.userId
			next()
		} catch {
			next(new Error('Invalid token'))
		}
	})

	io.on('connection', (socket) => {
		const userId = socket.userId
		socket.join(`user:${userId}`)

		socket.on('disconnect', () => {})
	})
}

module.exports = setupSocket
