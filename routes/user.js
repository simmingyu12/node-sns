const express = require('express');
const multer = require('multer');
const path = require('path');

const { isLoggedIn } = require('../middlewares');
const { follow } = require('../controllers/user');
const User = require('../models/user'); // Import the User model

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') }); // Set the upload directory

// POST /user/:id/follow
router.post('/:id/follow', isLoggedIn, follow);

// POST /user/nickname
router.post('/nickname', isLoggedIn, async (req, res, next) => {
  try {
    if (!req.user) {
      // If user is not authenticated, return an error response
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { nick } = req.body;
    req.user.nick = nick;
    await req.user.save();
    res.redirect('/profile');
  } catch (error) {
    next(error);
  }
});

// POST /user/:id/notfollow
router.post('/:id/notfollow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id } });
    if (user) {
      await req.user.removeFollowing(user); // Remove the user from the following list of the current user
      res.send('success');
    }
  } catch (error) {
    next(error);
  }
});

// POST /user/profile
router.post('/profile', isLoggedIn, upload.single('avatar'), async (req, res, next) => {
  try {
    const { nick, bio } = req.body;
    const { user } = req; // Retrieve the authenticated user from the request object

    // Update the user's nickname and bio
    user.nick = nick;
    user.bio = bio;

    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`; // Set the avatar path if a file is uploaded
    }

    await user.save(); // Save the changes to the user

    res.redirect('/profile');
  } catch (error) {
    next(error);
  }
});

module.exports = router;

