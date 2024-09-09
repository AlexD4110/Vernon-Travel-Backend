const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

//Getting all routers


router.get('/', async (req, res) => {
  try {
    
    const users = await User.find(); //Gets all the users
    res.json(users);
  } catch (err) { //catches the error
    res.status(500).json({message: err.message});
  }
});
//Getting one 
router.get('/:id', getUser,(req, res) => {
  res.json(res.user);
});

// Register (Create) a new user
router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword
    });
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//Updating one

router.patch('/', getUser, async (req, res) => {
  if (req.body.username != null) {
    res.user.username = req.body.username;
  }
  if (req.body.password != null) {
    res.user.password = req.body.password;
  }
  try {
    updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({message: err.message}); //something wrong with user data on server error
  }
})

//delete
router.delete('/:id', getUser, async (req, res) => {
  try {
    await res.user.remove();
    res.json({message: 'Deleted user'});
  } catch (err) {
    res.status(500).json({message: err.message}); //server error
  }
})

//middleware

async function getUser(req, res, next) {
  let user;
  try {
     user = await User.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({message: 'Cannot find user'});
    }
    res.user = user;
  } catch(err) {
    return res.status(500).json({message: err.message}); //server error
  }
  res.user = user;
  next(); //success to next middleware or request
}

module.exports = router;
