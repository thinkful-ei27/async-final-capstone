const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const User = require("../models/user");
const History = require("../models/history");
const Game = require("../models/game");

const router = express.Router();
const jwtAuth = passport.authenticate("jwt", {
  session: false,
  failWithError: true
});

router.get("/:id/history", (req, res, next) => {
  const { id } = req.params;

  History.find({ userId: id })
    .populate("gameOne", "name")
    .populate("gameTwo", "name")
    .populate("choice")
    .sort({ createdAt: -1 })
    .limit(6)
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

/* individual game data */

router.get("/:userId/topHistory", (req, res, next) => {
  const { userId } = req.params;

  History.find({ userId })
    .sort({ createdAt: -1 })
    .populate("gameOne", "name")
    .populate("gameTwo", "name")
    .populate("choice")
    .then(userHistory => {
      const names = [];
      const winCounts = userHistory
        .reduce((arr, game) => {
          const { name, id, igdb, cloudImage } = game.choice;
          // check if inside accumulator
          if (!names.includes(name)) {
            names.push(name);
            arr.push({
              count: 1,
              name,
              id,
              igdb,
              cloudImage
            });
          } else {
            const found = arr.find(game => game.name === name);
            found.count += 1;
          }

          return arr;
        }, [])
        .sort((a, b) => {
          if (a.count < b.count) return 1;
          if (a.count > b.count) return -1;
          return 0;
        })
        .slice(0, 6);

      res.json(winCounts);
    })
    .catch(err => next(err));
});
router.get("/recommendations", jwtAuth, (req, res, next) => {
  let topChoices;
  let sortedSimilarGames;
  const userId = req.user.id;
  // Find top game choices for user
  return History.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$choice", count: { $sum: 1 } } }
  ])
    .sort({ count: "desc" })
    .limit(100)
    .then(his => {
      // Grab game info for top choices
      topChoices = his.map(history => history._id);
      return Game.find({ _id: { $in: topChoices } });
    })
    .then(games => {
      // Extract similar_games and count them
      const similarGamesCount = {};
      games.forEach(game =>
        game.similar_games.forEach(similarGame => {
          similarGamesCount[similarGame]
            ? (similarGamesCount[similarGame] += 1)
            : (similarGamesCount[similarGame] = 1);
        })
      );
      sortedSimilarGames = Object.keys(similarGamesCount)
        .sort((a, b) => similarGamesCount[b] - similarGamesCount[a])
        .slice(0, 10);
      // Filter out excluded games here
      return User.findOne({ _id: userId }, { excludedGames: 1 });
    })
    .then(dbUser => {
      const { excludedGames } = dbUser;
      let filteredSimilarGames;
      if (excludedGames) {
        filteredSimilarGames = sortedSimilarGames.filter(function(simGame) {
          return this.indexOf(simGame) < 0;
        }, excludedGames);
      }
      return Game.find({ "igdb.id": { $in: filteredSimilarGames } });
    })
    .then(recs => {
      const sortedRecs = sortedSimilarGames
        .map(choice => recs.find(game => game.igdb.id === Number(choice)))
        .filter(e => typeof e === "object");
      res.json(sortedRecs);
    })
    .catch(err => next(err));
});

router.post("/aboutMe", jwtAuth, (req, res, next) => {
  const { content } = req.body;
  const userId = req.user.id;

  let user;
  User.findOne({ _id: userId })
    .then(_user => {
      user = _user;
      user.aboutMe = content;
      user.save();
    })
    .then(result => {
      console.log(req.originalUrl);
      res
        .location(`${req.originalUrl}`)
        .status(201)
        .json(result);
    })
    .catch(err => {
      next(err);
    });
});

router.get("/aboutMe", jwtAuth, (req, res, next) => {
  let user;
  const userId = req.user.id;
  User.findOne({ _id: userId }).then(_user => {
    user = _user;
    res.json(user.aboutMe);
  });
});
/* ========== POST USERS ========== */

router.post("/", (req, res, next) => {
  const { firstName, lastName, username, password, profilePic } = req.body;

  const requiredFields = ["firstName", "lastName", "username", "password"];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error("Missing field in body");
    err.status = 422;
    return next(err);
  }

  const stringFields = ["username", "password", "firstName", "lastName"];
  const nonStringField = stringFields.find(field => {
    return field in req.body && typeof req.body[field] !== "string";
  });

  if (nonStringField) {
    const err = new Error("Incorrect field type: expected string");
    err.status = 422;
    return next(err);
  }

  const explicitlyTrimmedFields = [
    "username",
    "password",
    "firstName",
    "lastName"
  ];
  const nonTrimmedField = explicitlyTrimmedFields.find(field => {
    return req.body[field].trim() !== req.body[field];
  });

  if (nonTrimmedField) {
    const err = new Error("Cannot start or end with whitespace");
    err.status = 422;
    return next(err);
  }

  const sizedFields = {
    username: {
      min: 2
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      "min" in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      "max" in sizedFields[field] &&
      req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
        : `Wow, what a secure password! However, passwords must be at most ${
            sizedFields[tooLargeField].max
          } characters long`,
      location: tooSmallField || tooLargeField
    });
  }

  return User.hashPassword(password)
    .then(digest => {
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const newUser = {
        username,
        password: digest,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        profilePic
      };
      return User.create(newUser);
    })
    .then(users => {
      res
        .location(`${req.originalUrl}/${users.id}`)
        .status(201)
        .json(users);
    })
    .catch(_err => {
      let err;
      if (err.code === 11000) {
        err = new Error("The username already exists");
        err.status = 400;
      } else {
        err = _err;
      }
      next(err);
    });
});

/* ========= PUT EXCLUDED GAMES ============= */
router.put("/excludedgames", jwtAuth, (req, res, next) => {
  const { id } = req.user;
  const { excludedId } = req.body;

  if (typeof excludedId !== "number") {
    const err = new Error("The id is not valid");
    err.status = 400;
    return next(err);
  }

  const update = {
    $addToSet: { excludedGames: excludedId }
  };

  let user;
  return User.findOneAndUpdate({ _id: id }, update, { new: true })
    .then(_user => {
      user = _user;
      res
        .location(`${req.originalUrl}`)
        .status(200)
        .json(user);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
