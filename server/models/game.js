const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  igdb: {
    id: { type: Number, required: true, unique: true },
    slug: { type: String, required: true }
  },
  coverUrl: { type: String, required: true }
});

schema.set("timestamps", true);

schema.set("toJSON", {
  virtuals: true,
  transform: (doc, result) => {
    delete result._id;
    delete result.__v;
  }
});

module.exports = mongoose.model("Game", schema);
