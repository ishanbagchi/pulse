const router = require('express').Router()
const rateLimit = require('express-rate-limit')
const authController = require('../controllers/authController')
const { authenticate, authorize } = require('../middleware/auth')

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many attempts, please try again later' },
})

router.post('/register', authLimiter, authController.register)
router.post('/login', authLimiter, authController.login)

router.get('/me', authenticate, authController.getMe)

router.get('/users', authenticate, authorize('admin'), authController.getUsers)

router.patch(
	'/users/:id/role',
	authenticate,
	authorize('admin'),
	authController.updateUserRole,
)

module.exports = router
