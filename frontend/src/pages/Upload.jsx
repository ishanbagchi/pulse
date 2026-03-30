import { Film, Upload as UploadIcon, X } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../lib/api'

export default function UploadPage() {
	const [file, setFile] = useState(null)
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [category, setCategory] = useState('')
	const [progress, setProgress] = useState(0)
	const [uploading, setUploading] = useState(false)
	const [dragOver, setDragOver] = useState(false)
	const inputRef = useRef(null)
	const navigate = useNavigate()

	const handleFile = (f) => {
		if (!f.type.startsWith('video/')) {
			return toast.error('Please select a video file')
		}
		if (f.size > 500 * 1024 * 1024) {
			return toast.error('File size must be under 500MB')
		}
		setFile(f)
		if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''))
	}

	const handleDrop = (e) => {
		e.preventDefault()
		setDragOver(false)
		const f = e.dataTransfer.files[0]
		if (f) handleFile(f)
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		if (!file) return toast.error('Select a video file')
		if (!title.trim()) return toast.error('Title is required')

		const formData = new FormData()
		formData.append('video', file)
		formData.append('title', title.trim())
		formData.append('description', description.trim())
		formData.append('category', category.trim())

		setUploading(true)
		try {
			await api.post('/videos', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
				onUploadProgress: (e) => {
					const pct = Math.round((e.loaded * 100) / e.total)
					setProgress(pct)
				},
			})
			toast.success('Video uploaded! Processing started.')
			navigate('/videos')
		} catch (err) {
			toast.error(err.response?.data?.error || 'Upload failed')
		} finally {
			setUploading(false)
			setProgress(0)
		}
	}

	return (
		<Layout>
			<div className="max-w-2xl mx-auto space-y-6">
				<h1 className="text-2xl font-bold text-gray-900">
					Upload Video
				</h1>

				<form
					onSubmit={handleSubmit}
					className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
				>
					<div
						onDragOver={(e) => {
							e.preventDefault()
							setDragOver(true)
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={handleDrop}
						onClick={() => inputRef.current?.click()}
						className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
							dragOver
								? 'border-indigo-500 bg-indigo-50'
								: file
									? 'border-green-300 bg-green-50'
									: 'border-gray-300 hover:border-gray-400'
						}`}
					>
						<input
							ref={inputRef}
							type="file"
							accept="video/*"
							className="hidden"
							onChange={(e) =>
								e.target.files[0] &&
								handleFile(e.target.files[0])
							}
						/>
						{file ? (
							<div className="space-y-2">
								<Film className="mx-auto h-10 w-10 text-green-500" />
								<p className="text-sm font-medium text-gray-900">
									{file.name}
								</p>
								<p className="text-xs text-gray-500">
									{(file.size / (1024 * 1024)).toFixed(1)} MB
								</p>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation()
										setFile(null)
									}}
									className="inline-flex items-center text-xs text-red-600 hover:text-red-700"
								>
									<X size={14} className="mr-1" /> Remove
								</button>
							</div>
						) : (
							<div className="space-y-2">
								<UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
								<p className="text-sm text-gray-600">
									Drag & drop a video or{' '}
									<span className="text-indigo-600 font-medium">
										browse
									</span>
								</p>
								<p className="text-xs text-gray-400">
									MP4, WebM, MOV, AVI up to 500MB
								</p>
							</div>
						)}
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Title *
						</label>
						<input
							type="text"
							required
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Description
						</label>
						<textarea
							rows={3}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							Category
						</label>
						<input
							type="text"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
							placeholder="e.g. Training, Marketing"
						/>
					</div>

					{uploading && (
						<div>
							<div className="flex justify-between text-sm text-gray-600 mb-1">
								<span>Uploading...</span>
								<span>{progress}%</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
									style={{ width: `${progress}%` }}
								/>
							</div>
						</div>
					)}

					<button
						type="submit"
						disabled={uploading || !file}
						className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
					>
						{uploading ? 'Uploading...' : 'Upload Video'}
					</button>
				</form>
			</div>
		</Layout>
	)
}
