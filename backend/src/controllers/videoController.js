const path = require('path')
const fs = require('fs')
const Video = require('../models/Video')
const config = require('../config')

exports.uploadVideo = async (req, res, next) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No video file provided' })
		}

		const { title, description, category } = req.body
		if (!title || !title.trim()) {
			return res.status(400).json({ error: 'Title is required' })
		}

		const video = await Video.create({
			title: title.trim(),
			description: description?.trim() || '',
			filename: req.file.path,
			originalName: req.file.originalname,
			mimeType: req.file.mimetype,
			size: req.file.size,
			user: req.user._id,
			organization: req.user.organization,
			category: category?.trim() || 'uncategorized',
			status: 'processing',
		})

		const processor = req.app.get('videoProcessor')
		processor.processVideo(video._id, req.user._id.toString())

		res.status(201).json({ video })
	} catch (error) {
		next(error)
	}
}

exports.getVideos = async (req, res, next) => {
	try {
		const {
			page = 1,
			limit = 12,
			status,
			sensitivityStatus,
			category,
			search,
			sortBy = 'createdAt',
			order = 'desc',
		} = req.query

		const filter = { organization: req.user.organization }

		if (req.user.role === 'viewer') {
			filter.user = req.user._id
		}

		if (status) filter.status = status
		if (sensitivityStatus) filter.sensitivityStatus = sensitivityStatus
		if (category && category !== 'all') filter.category = category
		if (search) {
			filter.title = { $regex: search, $options: 'i' }
		}

		const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)
		const sortOrder = order === 'asc' ? 1 : -1

		const [videos, total] = await Promise.all([
			Video.find(filter)
				.populate('user', 'name email')
				.sort({ [sortBy]: sortOrder })
				.skip(skip)
				.limit(parseInt(limit, 10)),
			Video.countDocuments(filter),
		])

		res.json({
			videos,
			pagination: {
				total,
				page: parseInt(page, 10),
				pages: Math.ceil(total / parseInt(limit, 10)),
			},
		})
	} catch (error) {
		next(error)
	}
}

exports.getVideo = async (req, res, next) => {
	try {
		const video = await Video.findById(req.params.id).populate(
			'user',
			'name email',
		)

		if (!video) {
			return res.status(404).json({ error: 'Video not found' })
		}

		if (
			req.user.role !== 'admin' &&
			video.organization !== req.user.organization
		) {
			return res.status(403).json({ error: 'Access denied' })
		}

		if (
			req.user.role === 'viewer' &&
			video.user._id.toString() !== req.user._id.toString()
		) {
			return res.status(403).json({ error: 'Access denied' })
		}

		res.json({ video })
	} catch (error) {
		next(error)
	}
}

exports.streamVideo = async (req, res, next) => {
	try {
		const video = await Video.findById(req.params.id)

		if (!video) {
			return res.status(404).json({ error: 'Video not found' })
		}

		if (req.user.role !== 'admin') {
			if (video.organization !== req.user.organization) {
				return res.status(403).json({ error: 'Access denied' })
			}
			if (
				req.user.role === 'viewer' &&
				video.user.toString() !== req.user._id.toString()
			) {
				return res.status(403).json({ error: 'Access denied' })
			}
		}

		const filePath = path.resolve(video.filename)
		const uploadDir = path.resolve(__dirname, '../../', config.uploadDir)
		if (!filePath.startsWith(uploadDir)) {
			return res.status(403).json({ error: 'Invalid file path' })
		}

		if (!fs.existsSync(filePath)) {
			return res.status(404).json({ error: 'Video file not found' })
		}

		const stat = fs.statSync(filePath)
		const fileSize = stat.size
		const range = req.headers.range

		if (range) {
			const parts = range.replace(/bytes=/, '').split('-')
			const start = parseInt(parts[0], 10)
			const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
			const chunkSize = end - start + 1

			const stream = fs.createReadStream(filePath, { start, end })

			res.writeHead(206, {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunkSize,
				'Content-Type': video.mimeType,
			})

			stream.pipe(res)
		} else {
			res.writeHead(200, {
				'Content-Length': fileSize,
				'Content-Type': video.mimeType,
			})
			fs.createReadStream(filePath).pipe(res)
		}
	} catch (error) {
		next(error)
	}
}

exports.deleteVideo = async (req, res, next) => {
	try {
		const video = await Video.findById(req.params.id)

		if (!video) {
			return res.status(404).json({ error: 'Video not found' })
		}

		const isOwner = video.user.toString() === req.user._id.toString()
		const isAdmin = req.user.role === 'admin'
		const sameOrg = video.organization === req.user.organization

		if (!sameOrg || (!isOwner && !isAdmin)) {
			return res.status(403).json({ error: 'Access denied' })
		}

		await Video.findByIdAndDelete(req.params.id)

		const filePath = path.resolve(video.filename)
		const uploadDir = path.resolve(__dirname, '../../', config.uploadDir)
		if (!filePath.startsWith(uploadDir)) {
			return res.json({
				error: 'Video record deleted, file path invalid',
			})
		}
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath)
		}

		if (video.thumbnail) {
			const thumbPath = path.resolve(
				path.dirname(video.filename),
				video.thumbnail,
			)
			if (fs.existsSync(thumbPath)) {
				fs.unlinkSync(thumbPath)
			}
		}

		res.json({ error: null, message: 'Video deleted successfully' })
	} catch (error) {
		next(error)
	}
}

exports.updateVideo = async (req, res, next) => {
	try {
		const { title, description, category } = req.body
		const video = await Video.findById(req.params.id)

		if (!video) {
			return res.status(404).json({ error: 'Video not found' })
		}

		const isOwner = video.user.toString() === req.user._id.toString()
		const isAdmin = req.user.role === 'admin'

		if (!isOwner && !isAdmin) {
			return res.status(403).json({ error: 'Access denied' })
		}

		const updates = {}
		if (title !== undefined) {
			if (!title.trim())
				return res.status(400).json({ error: 'Title cannot be empty' })
			updates.title = title.trim()
		}
		if (description !== undefined) updates.description = description.trim()
		if (category !== undefined && category.trim())
			updates.category = category.trim()

		const updated = await Video.findByIdAndUpdate(req.params.id, updates, {
			new: true,
		}).populate('user', 'name email')

		res.json({ video: updated })
	} catch (error) {
		next(error)
	}
}

exports.getStats = async (req, res, next) => {
	try {
		const filter = { organization: req.user.organization }
		if (req.user.role === 'viewer') filter.user = req.user._id

		const [total, safe, flagged, processing] = await Promise.all([
			Video.countDocuments(filter),
			Video.countDocuments({ ...filter, sensitivityStatus: 'safe' }),
			Video.countDocuments({ ...filter, sensitivityStatus: 'flagged' }),
			Video.countDocuments({ ...filter, status: 'processing' }),
		])

		res.json({ stats: { total, safe, flagged, processing } })
	} catch (error) {
		next(error)
	}
}
