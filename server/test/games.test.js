const chai = require("chai");
const chaiHttp = require("chai-http");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const { dbConnect, dbDisconnect, dbDrop } = require("../db-mongoose");
const { JWT_SECRET, TEST_DATABASE_URL } = require("../config");
const Game = require("../models/game");
const User = require("../models/user");
const { games, users } = require("../db/data");
const { app } = require("../index");

chai.use(chaiHttp);
const expect = chai.expect;
const sandbox = sinon.createSandbox();

describe("ASYNC Capstone API - Games", function() {
  let user = {};
  let token;

  before(() => dbConnect(TEST_DATABASE_URL));

  beforeEach(() => {
    return Promise.all([
      User.insertMany(users),
      Game.insertMany(games),
      User.createIndexes()
    ]).then(([users]) => {
      user = users[0];
      token = jwt.sign({ user }, JWT_SECRET, { subject: user.username });
    });
  });

  afterEach(() => {
    sandbox.restore();
    return dbDrop();
  });

  after(() => dbDisconnect());

  describe("GET /api/games", function() {
    it("should return the correct number of games", function() {
      return Promise.all([
        Game.find(),
        chai.request(app).get("/api/games")
      ]).then(([data, res]) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a("array");
        expect(res.body).to.have.length(data.length);
      });
    });

    it("should return those games in the correct order and with the correct fields", function() {
      return Promise.all([
        Game.find().sort({ name: "asc" }),
        chai.request(app).get("/api/games")
      ]).then(([data, res]) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.a("array");
        expect(res.body).to.have.length(data.length);
        res.body.forEach(function(item, i) {
          expect(item).to.be.a("object");
          expect(item).to.include.all.keys(
            "id",
            "name",
            "igdb",
            "coverUrl",
            "createdAt",
            "updatedAt"
          );
          expect(item.id).to.equal(data[i].id);
          expect(item.name).to.equal(data[i].name);
          expect(item.igdb).to.include.all.keys("id", "slug");
          expect(item.igdb.id).to.equal(data[i].igdb.id);
          expect(item.igdb.slug).to.equal(data[i].igdb.slug);
          expect(item.coverUrl).to.equal(data[i].coverUrl);
          expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
          expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
        });
      });
    });

    it("should catch errors and respond properly", function() {
      sandbox.stub(Game.schema.options.toJSON, "transform").throws("FakeError");

      return chai
        .request(app)
        .get("/api/games")
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body.message).to.equal("Internal Server Error");
        });
    });
  });

  describe("GET /api/games/battle", function() {
    it("should return two games", function() {
      return chai
        .request(app)
        .get("/api/games/battle")
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a("array");
          expect(res.body).to.have.length(2);
        });
    });

    it("should return different games with the correct fields", function() {
      return chai
        .request(app)
        .get("/api/games/battle")
        .then(res => {
          expect(res.body).to.be.a("array");
          res.body.forEach(function(item) {
            expect(item).to.be.a("object");
            expect(item).to.include.all.keys(
              "id",
              "name",
              "createdAt",
              "updatedAt"
            );
          });
          expect(res.body[0].id).to.not.equal(res.body[1].id);
          expect(res.body[0].name).to.not.equal(res.body[1].name);
        });
    });

    it("should return different games each time it is called", function() {
      return Promise.all([
        chai.request(app).get("/api/games/battle"),
        chai.request(app).get("/api/games/battle"),
        chai.request(app).get("/api/games/battle")
      ]).then(([res1, res2, res3]) => {
        expect(res1.body).to.be.an("array");
        expect(res2.body).to.be.an("array");
        expect(res3.body).to.be.an("array");
        expect(
          res1.body[0].id === res2.body[0].id &&
            res2.body[0].id === res3.body[0].id
        ).to.equal(false);
        expect(
          res1.body[1].id === res2.body[1].id &&
            res2.body[1].id === res3.body[1].id
        ).to.equal(false);
      });
    });

    it("shold catch errors and respond properly", function() {
      sandbox.stub(Game.schema.options.toJSON, "transform").throws("FakeError");

      return chai
        .request(app)
        .get("/api/games/battle")
        .then(res => {
          expect(res).to.have.status(500);
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body.message).to.equal("Internal Server Error");
        });
    });
  });

  describe("POST /api/games", function() {
    it.only("should create and return a new game when provided valid data", function() {
      const newGame = {
        igdbId: 3480
      };
      let res;
      return chai
        .request(app)
        .post("/api/games")
        .set("Authorization", `Bearer ${token}`)
        .send(newGame)
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(201);
          expect(res).to.have.header("location");
          expect(res).to.be.json;
          expect(res.body).to.be.a("object");
          expect(res.body).to.have.all.keys(
            "id",
            "name",
            "createdAt",
            "updatedAt",
            "igdb",
            "coverUrl"
          );
          return Game.findOne({ _id: res.body.id });
        })
        .then(data => {
          expect(res.body.id).to.equal(data.id);
          expect(res.body.name).to.equal(data.name);
          expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
          expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
          expect(res.body.coverUrl).to.equal(data.coverUrl);
          expect(data.igdb.id).to.equal(newGame.igdbId);
          expect(data.igdb.slug).to.equal(res.body.igdb.slug);
        });
    });

    it('should return an error when missing "igdbId" field');

    it('should return an error when "igdbId" is not a number');

    it('should return an error when "igdbId" is not recognized by IGDB');

    it("should reject duplicate games");

    it("should catch errors and respond properly");
  });
});
