import { AlertTriangle, Film, Loader, Shield, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../lib/api'
import { getSocket } from '../lib/socket'

export default function Dashboard() {
	const [stats, setStats] = useState({
		total: 0,
		safe: 0,
		flagged: 0,
		processing: 0,
	})
	const [recentVideos, setRecentVideos] = useState([])
	const [loading, setLoading] = useState(true)

	const fetchData = async () => {
		try {
			const [statsRes, videosRes] = await Promise.all([
				api.get('/videos/stats'),
				api.get('/videos?limit=5'),
			])
			setStats(statsRes.data.stats)
			setRecentVideos(videosRes.data.videos)
		} catch (err) {
			console.error('Dashboard fetch error:', err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()

		const socket = getSocket()
		if (socket) {
			socket.on('processing:complete', fetchData)
			return () => socket.off('processing:complete', fetchData)
		}
	}, [])

	const statCards = [
		{
			label: 'Total Videos',
			value: stats.total,
			icon: Film,
			color: 'bg-blue-500',
		},
		{
			label: 'Safe',
			value: stats.safe,
			icon: Shield,
			color: 'bg-green-500',
		},
		{
			label: 'Flagged',
			value: stats.flagged,
			icon: AlertTriangle,
			color: 'bg-red-500',
		},
		{
			label: 'Processing',
			value: stats.processing,
			icon: Loader,
			color: 'bg-yellow-500',
		},
	]

	if (loading) {
		return (
			<Layout>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
				</div>
			</Layout>
		)
	}

	return (
		<Layout>
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold text-gray-900">
						Dashboard
					</h1>
					<Link
						to="/upload"
						className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
					>
						<Upload size={16} />
						<span>Upload Video</span>
					</Link>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{statCards.map((card) => {
						const Icon = card.icon
						return (
							<div
								key={card.label}
								className="bg-white rounded-xl border border-gray-200 p-5"
							>
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-gray-500">
											{card.label}
										</p>
										<p className="text-2xl font-bold text-gray-900 mt-1">
											{card.value}
										</p>
									</div>
									<div
										className={`p-3 rounded-lg ${card.color} bg-opacity-10`}
									>
										<Icon
											size={20}
											className={card.color.replace(
												'bg-',
												'text-',
											)}
										/>
									</div>
								</div>
							</div>
						)
					})}
				</div>

				<div className="bg-white rounded-xl border border-gray-200">
					<div className="px-5 py-4 border-b border-gray-200">
						<h2 className="text-lg font-semibold text-gray-900">
							Recent Videos
						</h2>
					</div>
					{recentVideos.length === 0 ? (
						<div className="p-8 text-center text-gray-500">
							<Film className="mx-auto h-12 w-12 text-gray-300 mb-3" />
							<p>No videos uploaded yet</p>
							<Link
								to="/upload"
								className="text-indigo-600 hover:text-indigo-700 text-sm mt-1 inline-block"
							>
								Upload your first video
							</Link>
						</div>
					) : (
						<div className="divide-y divide-gray-100">
							{recentVideos.map((video) => (
								<Link
									key={video._id}
									to={`/videos/${video._id}`}
									className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
								>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900 truncate">
											{video.title}
										</p>
										<p className="text-xs text-gray-500">
											{new Date(
												video.createdAt,
											).toLocaleDateString()}
										</p>
									</div>
									<div className="flex items-center space-x-2 ml-4">
										<StatusBadge status={video.status} />
										<SensitivityBadge
											status={video.sensitivityStatus}
										/>
									</div>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</Layout>
	)
}

function StatusBadge({ status }) {
	const styles = {
		uploading: 'bg-gray-100 text-gray-700',
		processing: 'bg-yellow-100 text-yellow-700',
		completed: 'bg-green-100 text-green-700',
		failed: 'bg-red-100 text-red-700',
	}

	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.uploading}`}
		>
			{status}
		</span>
	)
}

function SensitivityBadge({ status }) {
	if (status === 'pending') return null

	const styles = {
		safe: 'bg-green-100 text-green-700',
		flagged: 'bg-red-100 text-red-700',
	}

	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status]}`}
		>
			{status}
		</span>
	)
}
