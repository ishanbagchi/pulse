import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'
import api from '../lib/api'
import { connectSocket, disconnectSocket } from '../lib/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
	const [user, setUser] = useState(() => {
		const stored = localStorage.getItem('user')
		return stored ? JSON.parse(stored) : null
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const token = localStorage.getItem('token')
		if (token) {
			api.get('/auth/me')
				.then((res) => {
					setUser(res.data.user)
					localStorage.setItem('user', JSON.stringify(res.data.user))
					connectSocket(token)
				})
				.catch(() => {
					localStorage.removeItem('token')
					localStorage.removeItem('user')
					setUser(null)
				})
				.finally(() => setLoading(false))
		} else {
			setLoading(false)
		}
	}, [])

	const login = useCallback(async (email, password) => {
		const { data } = await api.post('/auth/login', { email, password })
		localStorage.setItem('token', data.token)
		localStorage.setItem('user', JSON.stringify(data.user))
		setUser(data.user)
		connectSocket(data.token)
		return data
	}, [])

	const register = useCallback(
		async (name, email, password, organization) => {
			const { data } = await api.post('/auth/register', {
				name,
				email,
				password,
				organization,
			})
			localStorage.setItem('token', data.token)
			localStorage.setItem('user', JSON.stringify(data.user))
			setUser(data.user)
			connectSocket(data.token)
			return data
		},
		[],
	)

	const logout = useCallback(() => {
		localStorage.removeItem('token')
		localStorage.removeItem('user')
		setUser(null)
		disconnectSocket()
	}, [])

	return (
		<AuthContext.Provider
			value={{ user, loading, login, register, logout }}
		>
			{children}
		</AuthContext.Provider>
	)
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) throw new Error('useAuth must be used within AuthProvider')
	return context
}
