const mongoose = require('mongoose')

const videoSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			maxlength: 200,
		},
		description: {
			type: String,
			trim: true,
			maxlength: 1000,
			default: '',
		},
		filename: {
			type: String,
			required: true,
		},
		originalName: {
			type: String,
			required: true,
		},
		mimeType: {
			type: String,
			required: true,
		},
		size: {
			type: Number,
			required: true,
		},
		duration: {
			type: Number,
			default: 0,
		},
		resolution: {
			width: { type: Number, default: 0 },
			height: { type: Number, default: 0 },
		},
		status: {
			type: String,
			enum: ['uploading', 'processing', 'completed', 'failed'],
			default: 'uploading',
		},
		sensitivityStatus: {
			type: String,
			enum: ['pending', 'safe', 'flagged'],
			default: 'pending',
		},
		sensitivityDetails: {
			score: { type: Number, default: 0 },
			flags: [String],
			analyzedAt: Date,
		},
		processingProgress: {
			type: Number,
			default: 0,
			min: 0,
			max: 100,
		},
		thumbnail: {
			type: String,
			default: '',
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		organization: {
			type: String,
			default: 'default',
		},
		category: {
			type: String,
			trim: true,
			default: 'uncategorized',
		},
	},
	{ timestamps: true },
)

videoSchema.index({ user: 1, createdAt: -1 })
videoSchema.index({ organization: 1 })
videoSchema.index({ sensitivityStatus: 1 })
videoSchema.index({ status: 1 })

module.exports = mongoose.model('Video', videoSchema)
