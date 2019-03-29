const express = require("express");
const Game = require("../models/game");
const igdbApi = require("../utils/gameApi");
const { isValidId } = require("./validators");

const router = express.Router();

const findRandGame = count => {
  const rand = Math.floor(Math.random() * count);
  return Game.findOne().skip(rand);
};

const findTwoRandGames = count => {
  return Promise.all([findRandGame(count), findRandGame(count)]).then(results =>
    results[0].id === results[1].id ? findTwoRandGames(count) : results
  );
};

router.get("/", (req, res, next) => {
  const { slug } = req.query;
  const filter = {};

  if (slug) {
    filter["igdb.slug"] = slug;
  }

  Game.find(filter)
    .sort({ name: "asc" })
    .then(results => res.json(results))
    .catch(err => next(err));
});

// GET /api/games/battle must go before GET /api/games/:id or else it will never get called.
router.get("/battle", (req, res, next) => {
  return Game.countDocuments()
    .then(count => findTwoRandGames(count))
    .then(results => res.json(results))
    .catch(err => next(err));
});

router.get("/:id", isValidId, (req, res, next) => {
  const { id } = req.params;
  let game, gameInfo;
  Game.findOne({ _id: id })
    .then(_game => {
      _game ? (game = _game) : next();
      return Game.find({ "igdb.id": { $in: game.similar_games } }).then(
        similar_games => {
          const {
            name,
            igdb,
            coverUrl,
            platforms,
            genres,
            summary,
            createdAt,
            updatedAt
          } = game;
          gameInfo = Object.assign(
            {},
            {
              id,
              name,
              igdb,
              platforms,
              coverUrl,
              genres,
              summary,
              createdAt,
              updatedAt
            },
            { similar_games }
          );
          res.json(gameInfo);
        }
      );
    })
    .catch(err => next(err));
});

router.post("/", (req, res, next) => {
  const { igdbId } = req.body;

  if (!igdbId) {
    const err = new Error("Missing `igdbId` in request body");
    err.status = 400;
    return next(err);
  }

  if (!Number(igdbId)) {
    const err = new Error("`igdbId` should be a number");
    err.status = 400;
    return next(err);
  }

  return igdbApi
    .getGame(igdbId)
    .then(res => {
      const {
        name,
        cover,
        slug,
        summary,
        genres,
        platforms,
        similar_games
      } = res;
      const { image_id } = cover;
      const newGame = {
        igdb: {
          id: igdbId,
          slug
        },
        name,
        coverUrl: `https://images.igdb.com/igdb/image/upload/t_720p/${image_id}.jpg`,
        summary,
        genres,
        platforms,
        similar_games
      };
      return Game.create(newGame);
    })
    .then(game =>
      res
        .location(`${req.originalUrl}/${game.id}`)
        .status(201)
        .json(game)
    )
    .catch(err => {
      if (err.code === 11000) {
        err = new Error("Game already exists");
        err.status = 422;
        err.reason = "ValidationError";
        err.location = "igdbId";
      }
      next(err);
    });
});

module.exports = router;
