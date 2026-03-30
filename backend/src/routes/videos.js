const router = require('express').Router()
const videoController = require('../controllers/videoController')
const { authenticate, authorize } = require('../middleware/auth')
const upload = require('../middleware/upload')

router.use(authenticate)

router.post(
	'/',
	authorize('editor', 'admin'),
	(req, res, next) => {
		upload.single('video')(req, res, (err) => {
			if (err) {
				console.error('Upload error:', err.message)
				if (err.code === 'LIMIT_FILE_SIZE') {
					return res.status(413).json({ error: 'File too large' })
				}
				return res.status(400).json({ error: err.message })
			}
			next()
		})
	},
	videoController.uploadVideo,
)

router.get('/', videoController.getVideos)
router.get('/stats', videoController.getStats)
router.get('/:id', videoController.getVideo)
router.get('/:id/stream', videoController.streamVideo)
router.patch('/:id', authorize('editor', 'admin'), videoController.updateVideo)
router.delete('/:id', authorize('editor', 'admin'), videoController.deleteVideo)

module.exports = router
