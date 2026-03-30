const User = require('../models/User')
const { generateToken } = require('../utils/token')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

exports.register = async (req, res, next) => {
	try {
		const { name, email, password, organization } = req.body

		if (!name?.trim())
			return res.status(400).json({ error: 'Name is required' })
		if (!email || !EMAIL_RE.test(email))
			return res.status(400).json({ error: 'Valid email is required' })
		if (!password || password.length < 8)
			return res
				.status(400)
				.json({ error: 'Password must be at least 8 characters' })

		const existingUser = await User.findOne({ email })
		if (existingUser) {
			return res.status(409).json({ error: 'Email already registered' })
		}

		const user = await User.create({ name, email, password, organization })
		const token = generateToken(user._id)

		res.status(201).json({
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				organization: user.organization,
			},
		})
	} catch (error) {
		next(error)
	}
}

exports.login = async (req, res, next) => {
	try {
		const { email, password } = req.body
		if (!email || !EMAIL_RE.test(email))
			return res.status(400).json({ error: 'Valid email is required' })
		if (!password)
			return res.status(400).json({ error: 'Password is required' })
		const user = await User.findOne({ email }).select('+password')

		if (!user || !(await user.comparePassword(password))) {
			return res.status(401).json({ error: 'Invalid email or password' })
		}

		const token = generateToken(user._id)

		res.json({
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				organization: user.organization,
			},
		})
	} catch (error) {
		next(error)
	}
}

exports.getMe = async (req, res, next) => {
	try {
		if (!req.user) return res.status(401).json({ error: 'User not found' })
		res.json({
			user: {
				id: req.user._id,
				name: req.user.name,
				email: req.user.email,
				role: req.user.role,
				organization: req.user.organization,
			},
		})
	} catch (error) {
		next(error)
	}
}

exports.getUsers = async (req, res, next) => {
	try {
		const users = await User.find({ organization: req.user.organization })
		res.json({ users })
	} catch (error) {
		next(error)
	}
}

exports.updateUserRole = async (req, res, next) => {
	try {
		const { role } = req.body
		if (!['viewer', 'editor', 'admin'].includes(role)) {
			return res.status(400).json({ error: 'Invalid role' })
		}

		if (req.params.id === req.user._id.toString()) {
			return res
				.status(400)
				.json({ error: 'Cannot change your own role' })
		}

		const user = await User.findOneAndUpdate(
			{ _id: req.params.id, organization: req.user.organization },
			{ role },
			{ new: true },
		)

		if (!user) {
			return res.status(404).json({ error: 'User not found' })
		}

		res.json({ user })
	} catch (error) {
		next(error)
	}
}
