const mongoose = require('mongoose');
const { Schema } = mongoose;

const playerSchema = new Schema({
    playerFirstName: { type: String, required: true },
    playerLastName: { type: String, required: true },
    parentName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gradeLevel: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, required: true },
    address: {
        street: { type: String, required: true },
        town: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true }
    },
    emergencyContact: { type: String, required: true },
    registrationDate: { type: Date, default: Date.now } // Automatically set when registering
});

// Create the Player model
const Player = mongoose.model('Player', playerSchema);

module.exports = Player;
