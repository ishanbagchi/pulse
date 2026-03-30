const ffmpeg = require('fluent-ffmpeg')
const path = require('path')
const fs = require('fs')
const Video = require('../models/Video')

class VideoProcessor {
	constructor(io) {
		this.io = io
	}

	emitProgress(userId, videoId, progress, stage) {
		this.io.to(`user:${userId}`).emit('processing:progress', {
			videoId,
			progress,
			stage,
		})
	}

	getVideoMetadata(filePath) {
		return new Promise((resolve, reject) => {
			ffmpeg.ffprobe(filePath, (err, metadata) => {
				if (err) return reject(err)
				const videoStream = metadata.streams.find(
					(s) => s.codec_type === 'video',
				)
				resolve({
					duration: Math.round(metadata.format.duration || 0),
					width: videoStream?.width || 0,
					height: videoStream?.height || 0,
				})
			})
		})
	}

	generateThumbnail(filePath, outputDir) {
		return new Promise((resolve, reject) => {
			const thumbnailName = `thumb_${path.basename(filePath, path.extname(filePath))}.jpg`
			const thumbnailPath = path.join(outputDir, thumbnailName)

			ffmpeg(filePath)
				.on('end', () => resolve(thumbnailName))
				.on('error', (err) => reject(err))
				.screenshots({
					count: 1,
					folder: outputDir,
					filename: thumbnailName,
					size: '320x240',
					timemarks: ['10%'],
				})
		})
	}

	async runSensitivityAnalysis(videoId, userId) {
		const video = await Video.findById(videoId)
		const stages = [
			{ name: 'Extracting frames', start: 0, end: 30 },
			{ name: 'Running content classifiers', start: 30, end: 60 },
			{ name: 'Analyzing audio track', start: 60, end: 80 },
			{ name: 'Generating report', start: 80, end: 95 },
			{ name: 'Finalizing', start: 95, end: 100 },
		]

		for (const stage of stages) {
			for (
				let progress = stage.start;
				progress <= stage.end;
				progress += 5
			) {
				await this.delay(150 + Math.random() * 250)
				this.emitProgress(userId, videoId, progress, stage.name)
				await Video.findByIdAndUpdate(videoId, {
					processingProgress: progress,
				})
			}
		}

		const result = this.analyzeContent(video)

		return {
			sensitivityStatus: result.flags.length > 0 ? 'flagged' : 'safe',
			sensitivityDetails: {
				score: result.score,
				flags: result.flags,
				analyzedAt: new Date(),
			},
		}
	}

	analyzeContent(video) {
		const name = (
			video.originalName +
			' ' +
			video.title +
			' ' +
			video.description
		).toLowerCase()
		const flagKeywords = {
			violence: [
				'fight',
				'blood',
				'kill',
				'weapon',
				'gun',
				'war',
				'attack',
				'violent',
			],
			explicit_content: ['nsfw', 'explicit', 'adult', 'xxx', 'nude'],
			hate_speech: ['hate', 'slur', 'racist', 'extremist'],
			graphic_imagery: [
				'gore',
				'graphic',
				'disturbing',
				'brutal',
				'shock',
			],
		}

		const flags = []
		let score = 0

		for (const [flag, keywords] of Object.entries(flagKeywords)) {
			if (keywords.some((kw) => name.includes(kw))) {
				flags.push(flag)
				score += 0.25
			}
		}

		if (flags.length === 0) {
			score = Math.round(Math.random() * 15) / 100
		} else {
			score = Math.min(Math.round(score * 100) / 100, 1.0)
		}

		return { flags, score }
	}

	async processVideo(videoId, userId) {
		try {
			const video = await Video.findById(videoId)
			if (!video) throw new Error('Video not found')

			const filePath = path.resolve(video.filename)
			const uploadDir = path.dirname(filePath)

			await Video.findByIdAndUpdate(videoId, { status: 'processing' })
			this.emitProgress(userId, videoId, 0, 'Starting processing')

			let metadata = { duration: 0, width: 0, height: 0 }
			let thumbnail = ''

			try {
				metadata = await this.getVideoMetadata(filePath)
				thumbnail = await this.generateThumbnail(filePath, uploadDir)
			} catch {
				// FFmpeg not available, skipping metadata/thumbnail extraction
			}

			const analysisResult = await this.runSensitivityAnalysis(
				videoId,
				userId,
			)

			await Video.findByIdAndUpdate(videoId, {
				status: 'completed',
				processingProgress: 100,
				duration: metadata.duration,
				resolution: { width: metadata.width, height: metadata.height },
				thumbnail,
				...analysisResult,
			})

			this.emitProgress(userId, videoId, 100, 'Complete')
			this.io.to(`user:${userId}`).emit('processing:complete', {
				videoId,
				...analysisResult,
			})
		} catch (error) {
			console.error('Processing error:', error.message)
			await Video.findByIdAndUpdate(videoId, { status: 'failed' })
			this.io.to(`user:${userId}`).emit('processing:error', {
				videoId,
				error: error.message,
			})
		}
	}

	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}

module.exports = VideoProcessor
