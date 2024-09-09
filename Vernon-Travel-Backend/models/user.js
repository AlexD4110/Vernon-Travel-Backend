const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    creationDate: {
        type: Date,
        default: Date.now,
        required: true
    }
});

const User = mongoose.model('User', userSchema); //Assign user with json data

module.exports = User;
