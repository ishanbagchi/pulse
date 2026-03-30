const router = require('express').Router()
const videoController = require('../controllers/videoController')
const { authenticate, authorize } = require('../middleware/auth')
const upload = require('../middleware/upload')

router.use(authenticate)

router.post(
	'/',
	authorize('editor', 'admin'),
	upload.single('video'),
	videoController.uploadVideo,
)

router.get('/', videoController.getVideos)
router.get('/stats', videoController.getStats)
router.get('/:id', videoController.getVideo)
router.get('/:id/stream', videoController.streamVideo)
router.patch('/:id', authorize('editor', 'admin'), videoController.updateVideo)
router.delete('/:id', authorize('editor', 'admin'), videoController.deleteVideo)

module.exports = router
