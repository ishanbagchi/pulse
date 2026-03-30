const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
const fs = require('fs')

const config = require('./config')
const connectDB = require('./config/db')
const setupSocket = require('./config/socket')
const errorHandler = require('./middleware/errorHandler')
const VideoProcessor = require('./services/VideoProcessor')
const authRoutes = require('./routes/auth')
const videoRoutes = require('./routes/videos')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
	cors: {
		origin: config.corsOrigin
			.split(',')
			.map((o) => o.trim())
			.filter(Boolean),
		methods: ['GET', 'POST'],
	},
})

const uploadDir = path.resolve(__dirname, '../', config.uploadDir)
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true })
}

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

const allowedOrigins = config.corsOrigin
	.split(',')
	.map((o) => o.trim())
	.filter(Boolean)

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true)
			} else {
				callback(new Error(`CORS not allowed for origin: ${origin}`))
			}
		},
		credentials: true,
	}),
)
app.use(express.json({ limit: '10mb' }))

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 200,
	standardHeaders: true,
	legacyHeaders: false,
})
app.use('/api/', limiter)

const videoProcessor = new VideoProcessor(io)
app.set('videoProcessor', videoProcessor)

setupSocket(io)

app.use('/api/auth', authRoutes)
app.use('/api/videos', videoRoutes)

app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use(errorHandler)

const start = async () => {
	await connectDB()
	console.log('CORS_ORIGIN:', config.corsOrigin)
	console.log('Allowed origins:', allowedOrigins)
	server.listen(config.port, () => {
		console.log(`Server running on port ${config.port}`)
	})
}

start()

module.exports = { app, server }
