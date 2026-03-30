import { Film } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const { login } = useAuth()
	const navigate = useNavigate()

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		try {
			await login(email, password)
			toast.success('Welcome back!')
			navigate('/')
		} catch (err) {
			toast.error(err.response?.data?.error || 'Login failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
			<div className="max-w-md w-full space-y-8">
				<div className="text-center">
					<Film className="mx-auto h-12 w-12 text-indigo-600" />
					<h2 className="mt-4 text-3xl font-bold text-gray-900">
						Sign in to Pulse
					</h2>
					<p className="mt-2 text-sm text-gray-600">
						Video management & sensitivity analysis
					</p>
				</div>

				<form
					onSubmit={handleSubmit}
					className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-5"
				>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Email
						</label>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
							placeholder="you@example.com"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Password
						</label>
						<input
							type="password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
					>
						{loading ? 'Signing in...' : 'Sign in'}
					</button>

					<p className="text-center text-sm text-gray-600">
						Don't have an account?{' '}
						<Link
							to="/register"
							className="text-indigo-600 hover:text-indigo-700 font-medium"
						>
							Sign up
						</Link>
					</p>
				</form>
			</div>
		</div>
	)
}
