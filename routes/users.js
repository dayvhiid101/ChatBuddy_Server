const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");

const handleFollow = async (user, currentUser, res, action) => {
  try {
    if (!user) {
      return res.status(404).json({ error: `User to ${action} not found` });
    }

    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    const targetArray = action === 'follow' ? 'followers' : 'followings';
    const otherArray = action === 'follow' ? 'followings' : 'followers';

    if (!user[targetArray].includes(currentUser._id)) {
      await user.updateOne({ $push: { [targetArray]: currentUser._id } });
      await currentUser.updateOne({ $push: { [otherArray]: user._id } });
      return res.status(200).json({ message: `User has been ${action}ed` });
    } else {
      return res.status(403).json({ error: `You already ${action} this user` });
    }
  } catch (err) {
    console.error(err); // Log the error for debugging
    return res.status(500).json({ error: err.message });
  }
};

// Update user
router.put("/:id", async (req, res) => {
  try {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password, salt);
      }
      const updatedUser = await User.findByIdAndUpdate(req.params.id, {
        $set: req.body,
      });
      res.status(200).json({ message: "Account has been updated" });
    } else {
      res.status(403).json({ error: "You can update only your account!" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Delete user
router.delete("/:id", async (req, res) => {
  try {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Account has been deleted" });
    } else {
      res.status(403).json({ error: "You can delete only your account!" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a user
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId) // Corrected the variable name here
      : await User.findOne({ username: username }); // Corrected the capitalization of User model
      
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, updatedAt, ...other } = user._doc;
    res.status(200).json(other);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//get friends
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return User.findById(friendId);
      })
    );
    let friendList = [];
    friends.map((friend) => {
      const { _id, username, profilePicture } = friend;
      friendList.push({ _id, username, profilePicture });
    });
    res.status(200).json(friendList)
  } catch (err) {
    res.status(500).json(err);
  }
});

//Follow 
router.put("/:id/follow", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.body.userId);
    await handleFollow(user, currentUser, res, 'follow');
  } catch (error) {
    res.status(500).json(error);
  }
});

// Unfollow a user
router.put("/:id/unfollow", async (req, res) => {
  if (req.body.userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(req.body.userId);
      if (user.followers.includes(req.body.userId)) {
        await user.updateOne({ $pull: { followers: req.body.userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.status(200).json("user has been unfollowed");
      } else {
        res.status(403).json("you dont follow this user");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  } else {
    res.status(403).json("you cant unfollow yourself");
  }
});

module.exports = router;