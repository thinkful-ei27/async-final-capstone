const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const User = require("../models/user");
const History = require("../models/history");
const Game = require("../models/game");
const recs = require("../utils/recommendations");
const igdbApi = require("../utils/gameApi");
const { subMotivationKeywords } = require("../db/subMotivations");
const { isValidId } = require("./validators");

/**
 * @swagger
 *
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      required:
 *        - firstName
 *        - lastName
 *        - username
 *        - password
 *      properties:
 *        id:
 *          type: string
 *          example: 5c9bcf48b11f8f14c6e17730
 *        firstName:
 *          type: string
 *          example: Bob
 *        lastName:
 *          type: string
 *          example: User
 *        username:
 *          type: string
 *          example: bobuser
 *        password:
 *          type: string
 *          format: password
 *        createdAt:
 *          type: string
 *          format: date-time
 *        updatedAt:
 *          type: string
 *          format: date-time
 *        aboutMe:
 *          type: string
 *          example: I am definitely a person and not an example of a person.
 *        historyCount:
 *          type: integer
 *          format: int32
 *          example: 433
 *        level:
 *          type: string
 *          example: 020
 *        xpToNextLevel:
 *          type: string
 *          example: 433 / 441
 *        profilePic:
 *          type: string
 *          example: nes-kirby
 */

const router = express.Router();
const jwtAuth = passport.authenticate("jwt", {
  session: false,
  failWithError: true
});

const countBy = (arr, fn) =>
  arr.map(typeof fn === "function" ? fn : val => val[fn]).reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

const populateWishlist = igdbIds => {
  let games = [];
  return Game.find({ "igdb.id": { $in: igdbIds } })
    .then(dbGames => {
      if (dbGames.length === igdbIds.length) {
        return dbGames;
      }
      games = [...dbGames];
      const gameIgdbIds = games.map(game => game.igdb.id);
      const remainingIds = igdbIds.filter(
        igdbId => gameIgdbIds.indexOf(igdbId) < 0
      );
      return igdbApi.getGamesByIds(remainingIds);
    })
    .then(apiGames => {
      games = [...games, ...apiGames];
      return games;
    })
    .catch(err => err);
};

/**
 * @swagger
 *
 * /users:
 *  get:
 *    tags:
 *      - Users
 *    summary: Returns users
 *    parameters:
 *      - name: username
 *        in: query
 *        description: Username
 *        schema:
 *          type: string
 *        example: bobuser
 *    responses:
 *      401:
 *        description: Unauthorized error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: integer
 *                  format: int32
 *                  example: 401
 *                message:
 *                  type: string
 *                  example: Unauthorized
 *      200:
 *        description: Queried user
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      404:
 *        description: Not Found error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: integer
 *                  format: int32
 *                  example: 404
 *                message:
 *                  type: string
 *                  example: Not Found
 */
router.get("/", (req, res, next) => {
  const handleQueries = () => {
    if ("username" in req.query) {
      return User.findOne({ username: req.query.username });
    }
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  };
  return handleQueries()
    .then(results => (results ? res.json(results) : next()))
    .catch(err => next(err));
});

router.get("/:id/data", (req, res, next) => {
  const { id } = req.params;

  User.find({ _id: id })
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

router.get("/:id/history", (req, res, next) => {
  const { id } = req.params;
  return History.find({ userId: id })
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

router.get("/history/motivations", jwtAuth, (req, res, next) => {
  const { id } = req.user;

  History.find({ userId: id })
    .populate("gameOne", ["name", "motivations"])
    .populate("gameTwo", ["name", "motivations"])
    .populate("choice", ["name", "motivations"])
    .sort({ createdAt: -1 })
    .then(results => {
      const all = [];
      const choices = [];
      const m = results.map(res => {
        const gameOneMotivations = res.gameOne.motivations;
        const gameTwoMotivations = res.gameTwo.motivations;
        const choiceMotivations = res.choice.motivations;
        gameOneMotivations.forEach(ms => all.push(ms));
        gameTwoMotivations.forEach(ms => all.push(ms));
        choiceMotivations.forEach(ms => choices.push(ms));
      });
      const allMotives = countBy(all, v => v);
      const choiceMotives = countBy(choices, v => v);
      const percentages = Object.keys(choiceMotives).reduce((a, key) => {
        const percentage = Math.floor(
          (choiceMotives[key] / allMotives[key]) * 100
        );
        const data = {
          motivation: key,
          percentage,
          fullMark: 100
        };
        a.push(data);
        return a;
      }, []);
      res.json({
        "All Motivations": allMotives,
        "All Choices": choiceMotives,
        percentages
      });
    })
    .catch(err => next(err));
});

router.get("/history/submotivations", jwtAuth, (req, res, next) => {
  const { id } = req.user;

  History.find({ userId: id })
    .populate("gameOne", ["name", "subMotivations"])
    .populate("gameTwo", ["name", "subMotivations"])
    .populate("choice", ["name", "subMotivations"])
    .sort({ createdAt: -1 })
    .then(results => {
      const all = [];
      const choices = [];
      const m = results.map(res => {
        const gameOneSubMotivations = res.gameOne.subMotivations;
        const gameTwoSubMotivations = res.gameTwo.subMotivations;
        const choiceSubMotivations = res.choice.subMotivations;
        gameOneSubMotivations.forEach(ms => all.push(ms));
        gameTwoSubMotivations.forEach(ms => all.push(ms));
        choiceSubMotivations.forEach(ms => choices.push(ms));
      });
      const allMotives = countBy(all, v => v);
      const choiceMotives = countBy(choices, v => v);
      const percentagesMotives = Object.keys(choiceMotives).reduce((a, key) => {
        const percentage = Math.floor(
          (choiceMotives[key] / allMotives[key]) * 100
        );
        a[key] = percentage;
        return a;
      }, {});
      res.json({
        all: allMotives,
        choices: choiceMotives,
        choicePercentages: percentagesMotives
      });
    })
    .catch(err => next(err));
});

/* individual game data */

router.get("/:userId/topHistory", (req, res, next) => {
  const { userId } = req.params;

  History.find({ userId })
    .sort({ createdAt: -1 })
    .populate("choice")
    .then(userHistory => {
      const names = [];
      const winCounts = userHistory
        .reduce((arr, game) => {
          const { name, id, igdb, cloudImage } = game.choice;
          const { createdAt } = game;
          // check if inside accumulator
          if (!names.includes(name)) {
            names.push(name);
            arr.push({
              count: 1,
              name,
              id,
              igdb,
              cloudImage,
              createdAt
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

router.get("/excludedgames", jwtAuth, (req, res, next) => {
  const userId = req.user.id;
  User.findOne({ _id: userId }, { excludedGames: 1 })
    .then(user => {
      const igdbIds = user.excludedGames;
      return igdbApi.getGamesByIds(igdbIds);
    })
    .then(games => {
      res.json(games);
    })
    .catch(err => {
      next(err);
    });
});

router.post("/recs", jwtAuth, async (req, res, next) => {
  const userId = req.user.id;
  const { excludedGames } = await User.findOne(
    { _id: userId },
    { excludedGames: 1 }
  ).exec();
  const { motivations, dateNumber, timeFrame, platforms } = req.body;
  const arrayOfKeywords = motivations.reduce((a, b) => {
    const keywords = subMotivationKeywords[b];
    a.push(...keywords);
    return a;
  }, []);
  const checkedPlatforms = platforms
    .filter(p => {
      if (p.checked) {
        return p.id;
      }
    })
    .map(p => p.id)
    .join(",");

  const cp = !checkedPlatforms ? "" : checkedPlatforms;

  recs
    .getGamesBySubmotivations(
      // [...story, ...fantasy],
      arrayOfKeywords,
      [dateNumber, timeFrame],
      cp
    )
    .then(results => {
      const filter = results.filter(item => !excludedGames.includes(item.id));
      res.json(filter);
    })
    .catch(e => {
      next(e);
    });
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

router.get("/leaderboard", (req, res, next) => {
  User.find({})
    .then(results => {
      const sortedByLevel = results
        .reduce((a, b) => {
          const {
            username,
            level,
            xpToNextLevel,
            profilePic,
            historyCount
          } = b;
          const obj = {
            username,
            level,
            xpToNextLevel,
            profilePic,
            historyCount
          };
          a.push(obj);
          return a;
        }, [])
        .sort((a, b) => {
          if (a.historyCount < b.historyCount) return 1;
          if (a.historyCount > b.historyCount) return -1;
          return 0;
        });
      res.json(sortedByLevel);
    })
    .catch(e => {
      next(e);
    });
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
  User.findOne({ _id: userId })
    .then(_user => {
      user = _user;
      res.json(user.aboutMe);
    })
    .catch(err => next(err));
});

/**
 * @swagger
 *
 * /users:
 *  post:
 *    tags:
 *      - Users
 *    summary: Creates a user
 *    requestBody:
 *      description: User object
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *    responses:
 *      201:
 *        description: Created user
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      422:
 *        description: Validation error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: integer
 *                  format: int32
 *                  example: 422
 *                message:
 *                  type: string
 *                  example: Missing field in body
 *      400:
 *        description: Duplicate record error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: integer
 *                  format: int32
 *                  example: 400
 *                message:
 *                  type: string
 *                  example: The username already exists
 */
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

/* ========= PUT REMOVE EXCLUDED  ============= */
router.put("/removeexcluded", jwtAuth, (req, res, next) => {
  const { id } = req.user;
  const { excludedId } = req.body;

  if (typeof excludedId !== "number") {
    const err = new Error("The id is not valid");
    err.status = 400;
    return next(err);
  }
  const update = {
    $pull: { excludedGames: excludedId }
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

/* ========= PUT WISHLIST GAMES ============= */
router.put("/wishlist", jwtAuth, (req, res, next) => {
  const { id } = req.user;
  const { wishListId } = req.body;

  if (typeof wishListId !== "number") {
    const err = new Error("The id is not valid");
    err.status = 400;
    return next(err);
  }

  const update = {
    $addToSet: { wishList: wishListId }
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
    .catch(err => next(err));
});

/* =========PUT REMOVEWISHLIST GAMES ============= */
router.put("/removewishlist", jwtAuth, (req, res, next) => {
  const userId = req.user.id;
  const { wishListId } = req.body;
  const update = {
    $pull: { wishList: wishListId }
  };

  let user;
  return User.findOneAndUpdate({ _id: userId }, update, { new: true })
    .then(_user => {
      user = _user;
      res
        .location(`${req.originalUrl}`)
        .status(200)
        .json(user);
    })
    .catch(err => {
      return next(err);
    });
});

/**
 * @swagger
 *
 * /users/{userId}:
 *  put:
 *    tags:
 *      - Users
 *    summary: Updates a user
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - name: userId
 *        in: path
 *        required: true
 *        description: User ID
 *        schema:
 *          type: string
 *    requestBody:
 *      description: User object
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/User'
 *    responses:
 *      200:
 *        description: Updated user
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      400:
 *        description: Record error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: integer
 *                  format: int32
 *                  example: 400
 *                message:
 *                  type: string
 *                  example: The game ID is not valid
 *      401:
 *        description: Unauthorized error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: int
 *                  format: int32
 *                  example: 401
 *                message:
 *                  type: string
 *                  example: Unauthorized
 */
router.put("/:id", jwtAuth, isValidId, (req, res, next) => {
  const { id } = req.params;
  const { neverPlayed } = req.body;

  const toUpdate = {};
  const updateableFields = ["neverPlayed", "profilePic"];
  const updatedFields = [];

  updateableFields.forEach(field => {
    if (field in req.body) {
      updatedFields.push(field);
      if (field === "neverPlayed") {
        Object.assign(toUpdate, {
          $push: { "games.neverPlayed": req.body[field] }
        });
      } else {
        Object.assign(toUpdate, {
          $set: { [field]: req.body[field] }
        });
      }
    }
  });

  if (neverPlayed) {
    if (!mongoose.Types.ObjectId.isValid(neverPlayed)) {
      const err = new Error("The game ID is not valid");
      err.status = 400;
      return next(err);
    }
  }

  return User.findOneAndUpdate({ _id: id }, toUpdate, { new: true })
    .then(user => {
      if (!user) {
        return next();
      }
      const { createdAt, updatedAt } = user;
      const returnObj = { id, createdAt, updatedAt };
      updatedFields.forEach(field => {
        field === "neverPlayed"
          ? (returnObj.games = user.games)
          : (returnObj[field] = user[field]);
      });
      return res.json(returnObj);
    })
    .catch(err => next(err));
});

/**
 * @swagger
 *
 * /users/{userId}:
 *  get:
 *    tags:
 *      - Users
 *    summary: Retrieves a user
 *    security:
 *      - BearerAuth: []
 *    parameters:
 *      - name: userId
 *        in: path
 *        required: true
 *        description: User ID
 *        schema:
 *          type: string
 *      - name: fieldId
 *        in: path
 *        required: false
 *        description: Field ID
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: Updated user
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/User'
 *      401:
 *        description: Unauthorized error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: int
 *                  format: int32
 *                  example: 401
 *                message:
 *                  type: string
 *                  example: Unauthorized
 *      404:
 *        description: Not Found error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                status:
 *                  type: integer
 *                  format: int32
 *                  example: 404
 *                message:
 *                  type: string
 *                  example: Not Found
 */
router.get("/:id", isValidId, (req, res, next) => {
  const { id } = req.params;
  return User.findOne({ _id: id })
    .then(result => {
      result ? res.json(result) : next();
    })
    .catch(err => next(err));
});

// GET /api/users/:id/:field
router.get("/:id/:field", isValidId, (req, res, next) => {
  const { id, field } = req.params;
  const validFields = ["wishList"];
  if (validFields.indexOf(field) < 0) {
    const err = new Error("The field is not valid");
    err.status = 400;
    return next(err);
  }
  return User.findOne({ _id: id })
    .then(user =>
      field === "wishList"
        ? populateWishlist(user.wishList)
        : new Promise(resolve => resolve(user[field]))
    )
    .then(result => {
      result ? res.json(result) : next();
    })
    .catch(err => next(err));
});

module.exports = router;
