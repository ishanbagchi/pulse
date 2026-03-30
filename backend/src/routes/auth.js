const router = require('express').Router()
const authController = require('../controllers/authController')
const { authenticate, authorize } = require('../middleware/auth')

router.post('/register', authController.register)
router.post('/login', authController.login)

router.get('/me', authenticate, authController.getMe)

router.get('/users', authenticate, authorize('admin'), authController.getUsers)

router.patch(
	'/users/:id/role',
	authenticate,
	authorize('admin'),
	authController.updateUserRole,
)

module.exports = router
