const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    // Save user and respond
    const user = await newUser.save();
    res.status(201).json(user); // Use 201 status code for successful creation
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' }); // Use 401 status code for authentication failure
    }

    // Here you can generate and send a JWT token for authentication

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while logging in' });
  }
});

module.exports = router;