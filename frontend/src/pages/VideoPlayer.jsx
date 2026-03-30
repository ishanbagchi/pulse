import {
	AlertTriangle,
	ArrowLeft,
	Clock,
	HardDrive,
	Monitor,
	Shield,
	Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { getSocket } from '../lib/socket'

export default function VideoPlayer() {
	const { id } = useParams()
	const { user } = useAuth()
	const navigate = useNavigate()
	const [video, setVideo] = useState(null)
	const [loading, setLoading] = useState(true)
	const [processing, setProcessing] = useState(null)

	useEffect(() => {
		const fetchVideo = async () => {
			try {
				const { data } = await api.get(`/videos/${id}`)
				setVideo(data.video)
			} catch {
				toast.error('Video not found')
				navigate('/videos')
			} finally {
				setLoading(false)
			}
		}
		fetchVideo()
	}, [id, navigate])

	useEffect(() => {
		const socket = getSocket()
		if (!socket) return

		const onProgress = (data) => {
			if (data.videoId === id) {
				setProcessing({ progress: data.progress, stage: data.stage })
			}
		}

		const onComplete = async (data) => {
			if (data.videoId === id) {
				setProcessing(null)
				const { data: res } = await api.get(`/videos/${id}`)
				setVideo(res.video)
			}
		}

		socket.on('processing:progress', onProgress)
		socket.on('processing:complete', onComplete)
		socket.on('processing:error', onComplete)

		return () => {
			socket.off('processing:progress', onProgress)
			socket.off('processing:complete', onComplete)
			socket.off('processing:error', onComplete)
		}
	}, [id])

	const handleDelete = async () => {
		if (!window.confirm('Delete this video?')) return
		try {
			await api.delete(`/videos/${id}`)
			toast.success('Video deleted')
			navigate('/videos')
		} catch {
			toast.error('Delete failed')
		}
	}

	if (loading) {
		return (
			<Layout>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
				</div>
			</Layout>
		)
	}

	if (!video) return null

	const token = localStorage.getItem('token')
	const streamUrl = `/api/videos/${video._id}/stream`
	const canModify =
		user?.role === 'admin' ||
		video.user?._id === user?.id ||
		video.user === user?.id

	return (
		<Layout>
			<div className="max-w-4xl mx-auto space-y-6">
				<button
					onClick={() => navigate('/videos')}
					className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
				>
					<ArrowLeft size={16} className="mr-1" /> Back to library
				</button>

				{video.status === 'completed' ? (
					<div className="bg-black rounded-xl overflow-hidden">
						<video
							controls
							className="w-full max-h-[500px]"
							src={`${streamUrl}?token=${encodeURIComponent(token)}`}
						>
							Your browser does not support video playback.
						</video>
					</div>
				) : video.status === 'processing' ? (
					<div className="bg-gray-900 rounded-xl p-12 text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4" />
						<p className="text-white font-medium">
							Processing video...
						</p>
						{processing && (
							<div className="max-w-xs mx-auto mt-4">
								<div className="flex justify-between text-xs text-gray-400 mb-1">
									<span>{processing.stage}</span>
									<span>{processing.progress}%</span>
								</div>
								<div className="w-full bg-gray-700 rounded-full h-2">
									<div
										className="bg-indigo-500 h-2 rounded-full transition-all"
										style={{
											width: `${processing.progress}%`,
										}}
									/>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="bg-red-50 rounded-xl p-12 text-center">
						<AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-3" />
						<p className="text-red-700 font-medium">
							Processing failed
						</p>
					</div>
				)}

				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<div className="flex items-start justify-between">
						<div>
							<h1 className="text-xl font-bold text-gray-900">
								{video.title}
							</h1>
							{video.description && (
								<p className="text-gray-600 mt-2">
									{video.description}
								</p>
							)}
						</div>
						{canModify && (
							<button
								onClick={handleDelete}
								className="p-2 text-gray-400 hover:text-red-500 transition-colors"
							>
								<Trash2 size={18} />
							</button>
						)}
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
						<InfoCard
							icon={Clock}
							label="Duration"
							value={formatDuration(video.duration)}
						/>
						<InfoCard
							icon={HardDrive}
							label="Size"
							value={formatSize(video.size)}
						/>
						<InfoCard
							icon={Monitor}
							label="Resolution"
							value={
								video.resolution?.width
									? `${video.resolution.width}x${video.resolution.height}`
									: 'N/A'
							}
						/>
						<InfoCard
							label="Category"
							value={video.category || 'Uncategorized'}
						/>
					</div>
				</div>

				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						Sensitivity Analysis
					</h2>
					{video.sensitivityStatus === 'pending' ? (
						<p className="text-gray-500">Analysis pending...</p>
					) : (
						<div className="space-y-4">
							<div className="flex items-center space-x-3">
								{video.sensitivityStatus === 'safe' ? (
									<div className="flex items-center space-x-2 text-green-700">
										<Shield className="h-5 w-5" />
										<span className="font-medium">
											Safe
										</span>
									</div>
								) : (
									<div className="flex items-center space-x-2 text-red-700">
										<AlertTriangle className="h-5 w-5" />
										<span className="font-medium">
											Flagged
										</span>
									</div>
								)}
								<span className="text-sm text-gray-500">
									Score:{' '}
									{video.sensitivityDetails?.score ?? 'N/A'}
								</span>
							</div>

							{video.sensitivityDetails?.flags?.length > 0 && (
								<div>
									<p className="text-sm text-gray-600 mb-2">
										Detected issues:
									</p>
									<div className="flex flex-wrap gap-2">
										{video.sensitivityDetails.flags.map(
											(flag) => (
												<span
													key={flag}
													className="text-xs px-2.5 py-1 bg-red-50 text-red-700 rounded-full"
												>
													{flag.replace(/_/g, ' ')}
												</span>
											),
										)}
									</div>
								</div>
							)}

							{video.sensitivityDetails?.analyzedAt && (
								<p className="text-xs text-gray-400">
									Analyzed:{' '}
									{new Date(
										video.sensitivityDetails.analyzedAt,
									).toLocaleString()}
								</p>
							)}
						</div>
					)}
				</div>

				<div className="bg-white rounded-xl border border-gray-200 p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-3">
						Details
					</h2>
					<dl className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<dt className="text-gray-500">Uploaded by</dt>
							<dd className="text-gray-900 font-medium">
								{video.user?.name || 'Unknown'}
							</dd>
						</div>
						<div>
							<dt className="text-gray-500">Upload date</dt>
							<dd className="text-gray-900">
								{new Date(video.createdAt).toLocaleString()}
							</dd>
						</div>
						<div>
							<dt className="text-gray-500">File type</dt>
							<dd className="text-gray-900">{video.mimeType}</dd>
						</div>
						<div>
							<dt className="text-gray-500">Original name</dt>
							<dd className="text-gray-900 truncate">
								{video.originalName}
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</Layout>
	)
}

function InfoCard({ icon: Icon, label, value }) {
	return (
		<div className="p-3 bg-gray-50 rounded-lg">
			<div className="flex items-center space-x-2 text-gray-500 mb-1">
				{Icon && <Icon size={14} />}
				<span className="text-xs">{label}</span>
			</div>
			<p className="text-sm font-medium text-gray-900">{value}</p>
		</div>
	)
}

function formatDuration(seconds) {
	if (!seconds) return 'N/A'
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSize(bytes) {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
