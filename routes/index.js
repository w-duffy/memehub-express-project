const express = require("express");
const router = express.Router();

const { User, Meme, Comment, Like, Follow } = require("../db/models");
const { logoutUser } = require("../auth");
const { asyncHandler, isLoggedIn } = require("../utils");
const { memesByComments, memesByLikes } = require("./utils/meme-sorts");

/* GET home page -- default sorted by likes. */
router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    const memes = await Meme.findAll({
      include: [Comment, Like, User],
    });

    // fetch memes by most comments
    const trendingMemes = memes
      .filter((meme) => meme.Comments.length)
      .sort((a, b) => memesByComments(a, b))
      .slice(0, 6);

    // // console.log("hello", JSON.stringify(trendingMemes, null, 2));

    // // fetch memes by likes
    const feedMemes = memes
      .filter((meme) => meme.Likes.length)
      .sort((a, b) => memesByLikes(a, b));

    const bestMemes = feedMemes.slice(0, 10);

    // if user logged in, render landing-page, else render index
    res.render(isLoggedIn(req) ? "landing-page" : "index", {
      title: "Memehub",
      trendingMemes,
      bestMemes,
      feedMemes,
      i: 1,
    });
  })
);

// GET home page sorted by recent
router.get(
  "/recent",
  asyncHandler(async (req, res, next) => {
    const feedMemes = await Meme.findAll({
      order: [["id", "DESC"]],
      include: User,
    });
    res.render("index", { title: "Memehub", feedMemes });
  })
);

// GET home page sorted by most likes
router.get(
  "/hot",
  asyncHandler(async (req, res, next) => {
    const memes = await Meme.findAll({
      include: [Like, User],
    });

    const feedMemes = memes.sort((a, b) => memesByLikes(a, b));
    res.render("index", { title: "Memehub", feedMemes });
  })
);

// GET home page sorted by most comments
router.get(
  "/trending",
  asyncHandler(async (req, res, next) => {
    const memes = await Meme.findAll({
      include: [Comment, User],
    });

    const feedMemes = memes.sort((a, b) => memesByComments(a, b));
    // console.log(JSON.stringify(feedMemes, null, 2))

    res.render("index", { title: "Memehub", feedMemes });
  })
);

// GET following feed
router.get(
  "/you",
  asyncHandler(async (req, res, next) => {
    const { userId } = req.session.auth;

    // get logged in user & the users they're following
    const user = await User.findByPk(parseInt(userId, 10), {
      include: [
        {
          model: User,
          as: "followings",
          // include: Meme,
        },
      ],
    });
    // console.log(JSON.stringify(user.followings, null, 2));

    const feedMemes = user.followings.map(async (following) => {
      const { id } = following;
      const memes = await Meme.findAll({
        where: { userId: id },
        include: User,
      });
      return memes;
      // console.log(JSON.stringify(memes, null, 2));
    });

    console.log(JSON.stringify(feedMemes, null, 2));
    // console.log(feedMemes);
    // iterate through followings array
    // for each user, Meme.findAll(include: User), map to array
    // flatten array

    // get followings memes
    // TODO: fix -- get usernames
    // const feedMemes = user.followings.map((following) => following.Memes);

    // console.log(JSON.stringify(followMemes, null, 2));

    res.render("index", { title: "Memehub", feedMemes });
  })
);

module.exports = router;
