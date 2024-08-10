const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  name: String,
  date: Date,
  certification: String,
  courseType: String,
  status: String,
  score: Number,
  totalScore: Number,
  sessionLink: String,
});

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
