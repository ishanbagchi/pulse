import {
	Film,
	LayoutDashboard,
	LogOut,
	Menu,
	Upload,
	Users,
	X,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
	const { user, logout } = useAuth()
	const location = useLocation()
	const navigate = useNavigate()
	const [sidebarOpen, setSidebarOpen] = useState(false)

	const handleLogout = () => {
		logout()
		navigate('/login')
	}

	const navItems = [
		{ to: '/', icon: LayoutDashboard, label: 'Dashboard' },
		{
			to: '/upload',
			icon: Upload,
			label: 'Upload',
			roles: ['editor', 'admin'],
		},
		{ to: '/videos', icon: Film, label: 'Videos' },
		{ to: '/admin', icon: Users, label: 'Admin', roles: ['admin'] },
	]

	const filteredNav = navItems.filter(
		(item) => !item.roles || item.roles.includes(user?.role),
	)

	return (
		<div className="min-h-screen bg-gray-50">
			<nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between h-16">
						<div className="flex items-center">
							<button
								onClick={() => setSidebarOpen(!sidebarOpen)}
								className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700"
							>
								{sidebarOpen ? (
									<X size={20} />
								) : (
									<Menu size={20} />
								)}
							</button>
							<Link
								to="/"
								className="flex items-center space-x-2 ml-2 md:ml-0"
							>
								<Film className="h-8 w-8 text-indigo-600" />
								<span className="text-xl font-bold text-gray-900">
									Pulse
								</span>
							</Link>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600 hidden sm:block">
								{user?.name}
							</span>
							<span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 capitalize">
								{user?.role}
							</span>
							<button
								onClick={handleLogout}
								className="p-2 text-gray-500 hover:text-red-600 transition-colors"
							>
								<LogOut size={18} />
							</button>
						</div>
					</div>
				</div>
			</nav>

			<div className="flex pt-16">
				<aside
					className={`fixed md:static inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out pt-16 md:pt-0 ${
						sidebarOpen
							? 'translate-x-0'
							: '-translate-x-full md:translate-x-0'
					}`}
				>
					<div className="p-4 space-y-1">
						{filteredNav.map((item) => {
							const Icon = item.icon
							const active = location.pathname === item.to
							return (
								<Link
									key={item.to}
									to={item.to}
									onClick={() => setSidebarOpen(false)}
									className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
										active
											? 'bg-indigo-50 text-indigo-700'
											: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
									}`}
								>
									<Icon size={18} />
									<span>{item.label}</span>
								</Link>
							)
						})}
					</div>
				</aside>

				{sidebarOpen && (
					<div
						className="fixed inset-0 z-10 bg-black/20 md:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				<main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
					{children}
				</main>
			</div>
		</div>
	)
}
