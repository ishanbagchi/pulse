import { io } from 'socket.io-client'

const SOCKET_URL =
	import.meta.env.VITE_SOCKET_URL ||
	(typeof window !== 'undefined' && window.location.hostname !== 'localhost'
		? `${window.location.protocol}//${window.location.host}`
		: 'http://localhost:5001')

let socket = null

export const connectSocket = (token) => {
	if (socket?.connected) return socket

	socket = io(SOCKET_URL, {
		auth: { token },
		transports: ['websocket', 'polling'],
	})

	socket.on('connect', () => {
		console.log('Socket connected')
	})

	socket.on('connect_error', (err) => {
		console.error('Socket connection error:', err.message)
	})

	return socket
}

export const disconnectSocket = () => {
	if (socket) {
		socket.disconnect()
		socket = null
	}
}

export const getSocket = () => socket
