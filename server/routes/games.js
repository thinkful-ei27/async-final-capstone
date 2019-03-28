const express = require("express");
const Game = require("../models/game");
const igdbApi = require("../utils/gameApi");

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
  Game.find()
    .sort({ name: "asc" })
    .then(results => res.json(results))
    .catch(err => next(err));
});

router.get("/battle", (req, res, next) => {
  return Game.countDocuments()
    .then(count => findTwoRandGames(count))
    .then(results => res.json(results))
    .catch(err => next(err));
});

router.get("/:id", (req, res, next) => {
  Game.findOne()
    .then(game => res.json(game))
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
