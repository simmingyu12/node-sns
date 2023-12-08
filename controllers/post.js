const { User, Post, Hashtag } = require('../models');

exports.afterUploadImage = (req, res) => {
  console.log(req.file);
  res.json({ url: `/img/${req.file.filename}` });
};

exports.uploadPost = async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      img: req.body.url,
      UserId: req.user.id,
    });
    const hashtags = req.body.content.match(/#[^\s#]*/g); // Extract hashtags using regular expression
    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((tag) => {
          return Hashtag.findOrCreate({
            where: { title: tag.slice(1).toLowerCase() },
          });
        })
      );
      await post.addHashtags(result.map((r) => r[0]));
    }
    res.redirect('/');
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    await Post.destroy({ where: { id: postId, UserId: req.user.id } });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.updateNickname = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const newNickname = req.body.nickname;
    const user = await User.findOne({ where: { id: userId } });
    if (user) {
      user.nickname = newNickname;
      await user.save();
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};
