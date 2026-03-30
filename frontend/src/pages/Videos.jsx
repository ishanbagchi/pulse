import { Film, Play, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { getSocket } from '../lib/socket'

export default function Videos() {
	const { user } = useAuth()
	const [videos, setVideos] = useState([])
	const [loading, setLoading] = useState(true)
	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		pages: 1,
	})
	const [filters, setFilters] = useState({
		search: '',
		sensitivityStatus: '',
		status: '',
		category: '',
	})
	const [processingMap, setProcessingMap] = useState({})

	const fetchVideos = useCallback(
		async (page = 1) => {
			try {
				const params = { page, limit: 12 }
				if (filters.search) params.search = filters.search
				if (filters.sensitivityStatus)
					params.sensitivityStatus = filters.sensitivityStatus
				if (filters.status) params.status = filters.status
				if (filters.category) params.category = filters.category

				const { data } = await api.get('/videos', { params })
				setVideos(data.videos)
				setPagination(data.pagination)
			} catch (err) {
				toast.error('Failed to load videos')
			} finally {
				setLoading(false)
			}
		},
		[filters],
	)

	useEffect(() => {
		fetchVideos()
	}, [fetchVideos])

	useEffect(() => {
		const socket = getSocket()
		if (!socket) return

		const onProgress = (data) => {
			setProcessingMap((prev) => ({
				...prev,
				[data.videoId]: { progress: data.progress, stage: data.stage },
			}))
		}

		const onComplete = () => {
			fetchVideos(pagination.page)
		}

		socket.on('processing:progress', onProgress)
		socket.on('processing:complete', onComplete)
		socket.on('processing:error', onComplete)

		return () => {
			socket.off('processing:progress', onProgress)
			socket.off('processing:complete', onComplete)
			socket.off('processing:error', onComplete)
		}
	}, [fetchVideos, pagination.page])

	const handleDelete = async (id) => {
		if (!window.confirm('Delete this video?')) return
		try {
			await api.delete(`/videos/${id}`)
			toast.success('Video deleted')
			fetchVideos(pagination.page)
		} catch (err) {
			toast.error('Delete failed')
		}
	}

	const canModify = user?.role === 'editor' || user?.role === 'admin'

	return (
		<Layout>
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-gray-900">
					Video Library
				</h1>

				<div className="bg-white rounded-xl border border-gray-200 p-4">
					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<input
								type="text"
								placeholder="Search videos..."
								value={filters.search}
								onChange={(e) =>
									setFilters((p) => ({
										...p,
										search: e.target.value,
									}))
								}
								className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
							/>
						</div>
						<div className="flex gap-2">
							<select
								value={filters.sensitivityStatus}
								onChange={(e) =>
									setFilters((p) => ({
										...p,
										sensitivityStatus: e.target.value,
									}))
								}
								className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
							>
								<option value="">All Safety</option>
								<option value="safe">Safe</option>
								<option value="flagged">Flagged</option>
								<option value="pending">Pending</option>
							</select>
							<select
								value={filters.status}
								onChange={(e) =>
									setFilters((p) => ({
										...p,
										status: e.target.value,
									}))
								}
								className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
							>
								<option value="">All Status</option>
								<option value="processing">Processing</option>
								<option value="completed">Completed</option>
								<option value="failed">Failed</option>
							</select>
						</div>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center h-40">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
					</div>
				) : videos.length === 0 ? (
					<div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
						<Film className="mx-auto h-12 w-12 text-gray-300 mb-3" />
						<p className="text-gray-500">No videos found</p>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{videos.map((video) => {
								const proc = processingMap[video._id]
								const isProcessing =
									video.status === 'processing'

								return (
									<div
										key={video._id}
										className="bg-white rounded-xl border border-gray-200 overflow-hidden group"
									>
										<Link
											to={`/videos/${video._id}`}
											className="block"
										>
											<div className="aspect-video bg-gray-100 flex items-center justify-center relative">
												<Film className="h-10 w-10 text-gray-300" />
												{video.status ===
													'completed' && (
													<div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
														<Play className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
													</div>
												)}
												{isProcessing && proc && (
													<div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-2">
														<div className="flex justify-between text-xs text-white mb-1">
															<span>
																{proc.stage}
															</span>
															<span>
																{proc.progress}%
															</span>
														</div>
														<div className="w-full bg-white/30 rounded-full h-1.5">
															<div
																className="bg-indigo-400 h-1.5 rounded-full transition-all"
																style={{
																	width: `${proc.progress}%`,
																}}
															/>
														</div>
													</div>
												)}
											</div>
										</Link>

										<div className="p-4">
											<Link to={`/videos/${video._id}`}>
												<h3 className="font-medium text-gray-900 truncate hover:text-indigo-600">
													{video.title}
												</h3>
											</Link>
											<p className="text-xs text-gray-500 mt-1">
												{formatSize(video.size)} •{' '}
												{new Date(
													video.createdAt,
												).toLocaleDateString()}
											</p>
											<div className="flex items-center justify-between mt-3">
												<div className="flex gap-1.5">
													<span
														className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(video.status)}`}
													>
														{video.status}
													</span>
													{video.sensitivityStatus !==
														'pending' && (
														<span
															className={`text-xs px-2 py-0.5 rounded-full font-medium ${sensitivityColor(video.sensitivityStatus)}`}
														>
															{
																video.sensitivityStatus
															}
														</span>
													)}
												</div>
												{canModify && (
													<button
														onClick={() =>
															handleDelete(
																video._id,
															)
														}
														className="p-1 text-gray-400 hover:text-red-500 transition-colors"
													>
														<Trash2 size={14} />
													</button>
												)}
											</div>
										</div>
									</div>
								)
							})}
						</div>

						{pagination.pages > 1 && (
							<div className="flex justify-center gap-2">
								{Array.from(
									{ length: pagination.pages },
									(_, i) => i + 1,
								).map((p) => (
									<button
										key={p}
										onClick={() => fetchVideos(p)}
										className={`px-3 py-1.5 rounded text-sm ${
											p === pagination.page
												? 'bg-indigo-600 text-white'
												: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
										}`}
									>
										{p}
									</button>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</Layout>
	)
}

function formatSize(bytes) {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusColor(status) {
	const map = {
		uploading: 'bg-gray-100 text-gray-700',
		processing: 'bg-yellow-100 text-yellow-700',
		completed: 'bg-green-100 text-green-700',
		failed: 'bg-red-100 text-red-700',
	}
	return map[status] || map.uploading
}

function sensitivityColor(status) {
	return status === 'safe'
		? 'bg-green-100 text-green-700'
		: 'bg-red-100 text-red-700'
}
