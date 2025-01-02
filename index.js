const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const { ObjectId } = require("mongodb");
const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const UserSchema = new Schema({
  username: { type: String, required: true },
});

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});
const User = model("User", UserSchema);
const Exercise = model("Exercise", exerciseSchema);

app.post("/api/users", async (req, res) => {
  User.create({ username: req.body.username })
    .then((user) => {
      res.json({ username: user.username, _id: user._id });
    })
    .catch((err) => {
      res.json({ error: "Username already taken" });
    });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;

  const { description, duration, date } = req.body;
  const user = await User.findById(_id);
  if (!user) {
    return res.json({ error: "User not found" });
  }
  //console.log(user);
  const exercise = {
    userId: _id,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date(),
  };

  Exercise.create(exercise)
    .then((exercise) => {
      res.json(
        // {
        //   username: user.username,
        //   description: exercise.description,
        //   duration: exercise.duration,
        //   _id: user._id,
        //   date: exercise.date.toLocaleString,
        // }

        {
          _id: user._id,
          username: user.username,
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString(),
        }
      );
    })
    .catch((err) => {
      res.json({ error: "Error creating exercise" });
    });
});
app.get("/api/users", (req, res) => {
  User.find({})
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      res.json({ error: "Error fetching users" });
    });
});
app.get("/api/users/:_id/logs", async (req, res) => {

  /*
  :_id is the parameter that we are going to use to find the user
  logs is the endpoint that we are going to use to get the exercises of the user.
  */
  const { _id } = req.params;
  
  const user = await User.findById(_id);
  if (!user) {
    return res.json({ error: "User not found" });
  } else {
    const exercises = await Exercise.find({ userId: _id }).limit(
      parseInt(req.query.limit)
    );

    let formatedExercise = exercises.map((exercise) => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      };
    });

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: formatedExercise,
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
