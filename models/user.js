const mongoose = require('./db');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const User = mongoose.model('User', UserSchema);

module.exports = User;

//User.sync({ force: true }); (MYSQL DB'S)