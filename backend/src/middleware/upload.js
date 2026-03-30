const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')

const ALLOWED_MIME_TYPES = [
	'video/mp4',
	'video/mpeg',
	'video/webm',
	'video/quicktime',
	'video/x-msvideo',
	'video/x-matroska',
]

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve(config.uploadDir))
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = crypto.randomBytes(16).toString('hex')
		const ext = path.extname(file.originalname)
		cb(null, `${uniqueSuffix}${ext}`)
	},
})

const fileFilter = (req, file, cb) => {
	if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
		cb(null, true)
	} else {
		cb(new Error('Invalid file type. Only video files are allowed.'), false)
	}
}

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: config.maxFileSize,
	},
})

module.exports = upload
