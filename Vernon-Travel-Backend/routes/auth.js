const express = require('express');
const bcrypt = require('bcryptjs');
const Player = require('../models/player'); 
const router = express.Router();

// Get all registered players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find(); // Gets all the registered players
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one player by ID
router.get('/:id', getPlayer, (req, res) => {
  res.json(res.player);
});

// Register (Create) a new player
router.post('/register', async (req, res) => {
  try {
    
    const player = new Player({
      playerFirstName: req.body.playerFirstName,
      playerLastName: req.body.playerLastName,
      parentName: req.body.parentName,
      email: req.body.email,
      gradeLevel: req.body.gradeLevel,
      phone: req.body.phone,
      gender: req.body.gender,
      address: {
        street: req.body.street,
        town: req.body.town,
        state: req.body.state,
        zip: req.body.zip
      },
      emergencyContact: req.body.emergencyContact,
    });
    
    const newPlayer = await player.save();
    res.status(201).json(newPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update player details
router.patch('/:id', getPlayer, async (req, res) => {
  if (req.body.playerFirstName != null) {
    res.player.playerFirstName = req.body.playerFirstName;
  }
  if (req.body.playerLastName != null) {
    res.player.playerLastName = req.body.playerLastName;
  }
  if (req.body.parentName != null) {
    res.player.parentName = req.body.parentName;
  }
  if (req.body.email != null) {
    res.player.email = req.body.email;
  }
  if (req.body.gradeLevel != null) {
    res.player.gradeLevel = req.body.gradeLevel;
  }
  if (req.body.phone != null) {
    res.player.phone = req.body.phone;
  }
  if (req.body.gender != null) {
    res.player.gender = req.body.gender;
  }
  if (req.body.street != null) {
    res.player.address.street = req.body.street;
  }
  if (req.body.town != null) {
    res.player.address.town = req.body.town;
  }
  if (req.body.state != null) {
    res.player.address.state = req.body.state;
  }
  if (req.body.zip != null) {
    res.player.address.zip = req.body.zip;
  }
  if (req.body.emergencyContact != null) {
    res.player.emergencyContact = req.body.emergencyContact;
  }
  
  try {
    const updatedPlayer = await res.player.save();
    res.json(updatedPlayer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a player
router.delete('/:id', getPlayer, async (req, res) => {
  try {
    await res.player.remove();
    res.json({ message: 'Deleted Player' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get player by ID
async function getPlayer(req, res, next) {
  let player;
  try {
    player = await Player.findById(req.params.id);
    if (player == null) {
      return res.status(404).json({ message: 'Cannot find player' });
    }
    res.player = player;
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  next();
}

module.exports = router;
