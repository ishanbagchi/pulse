const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 100,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
			select: false,
		},
		role: {
			type: String,
			enum: ['viewer', 'editor', 'admin'],
			default: 'editor',
		},
		organization: {
			type: String,
			trim: true,
			default: 'default',
			set: (v) => (!v || !v.trim() ? 'default' : v),
		},
	},
	{ timestamps: true },
)

userSchema.pre('save', async function () {
	if (!this.isModified('password')) return
	this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = async function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.toJSON = function () {
	const obj = this.toObject()
	delete obj.password
	return obj
}

module.exports = mongoose.model('User', userSchema)
