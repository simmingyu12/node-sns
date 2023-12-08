const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { afterUploadImage, uploadPost } = require('../controllers/post');
const { isLoggedIn } = require('../middlewares');
const Post = require('../models/post'); // Import the Post model
const User = require('../models/user'); // Import the User model

const router = express.Router();

// uploads 폴더가 없으면 생성
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 생성합니다.');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads/');
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /post/img
router.post('/img', isLoggedIn, upload.single('img'), afterUploadImage);

// POST /post
const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), uploadPost);

// DELETE /post/:postId
router.delete('/:postId', isLoggedIn, async (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.user.id;

  try {
    // Find the post by postId and userId to ensure the user has the authorization to delete the post
    const post = await Post.findOne({
      where: { id: postId, userId: userId },
    });

    if (!post) {
      // If the post doesn't exist or the user doesn't have the authorization, return an error response
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    // Delete the post
    await post.destroy();

    // Send a success response
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

// POST /user/:id/unfollow
router.post('/:id/unfollow', isLoggedIn, async (req, res, next) => {
  const userIdToUnfollow = req.params.id;
  const currentUserId = req.user.id;

  try {
    // Find the current user and the user to unfollow
    const currentUser = await User.findByPk(currentUserId);
    const userToUnfollow = await User.findByPk(userIdToUnfollow);

    if (!currentUser || !userToUnfollow) {
      // If either user doesn't exist, return an error response
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove the userToUnfollow from the followers of the currentUser
    await currentUser.removeFollower(userToUnfollow);

    // Send a success response
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = router;