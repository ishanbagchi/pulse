import { Film } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
	const [form, setForm] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
		organization: '',
	})
	const [loading, setLoading] = useState(false)
	const { register } = useAuth()
	const navigate = useNavigate()

	const handleChange = (e) => {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (form.password !== form.confirmPassword) {
			return toast.error("Passwords don't match")
		}
		setLoading(true)
		try {
			await register(
				form.name,
				form.email,
				form.password,
				form.organization,
			)
			toast.success('Account created!')
			navigate('/')
		} catch (err) {
			toast.error(err.response?.data?.error || 'Registration failed')
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
						Create your account
					</h2>
				</div>

				<form
					onSubmit={handleSubmit}
					className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-5"
				>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Name
						</label>
						<input
							type="text"
							name="name"
							required
							value={form.name}
							onChange={handleChange}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Email
						</label>
						<input
							type="email"
							name="email"
							required
							value={form.email}
							onChange={handleChange}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Organization
						</label>
						<input
							type="text"
							name="organization"
							value={form.organization}
							onChange={handleChange}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
							placeholder="Optional"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Password
						</label>
						<input
							type="password"
							name="password"
							required
							minLength={6}
							value={form.password}
							onChange={handleChange}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Confirm Password
						</label>
						<input
							type="password"
							name="confirmPassword"
							required
							value={form.confirmPassword}
							onChange={handleChange}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
					>
						{loading ? 'Creating account...' : 'Create account'}
					</button>

					<p className="text-center text-sm text-gray-600">
						Already have an account?{' '}
						<Link
							to="/login"
							className="text-indigo-600 hover:text-indigo-700 font-medium"
						>
							Sign in
						</Link>
					</p>
				</form>
			</div>
		</div>
	)
}
