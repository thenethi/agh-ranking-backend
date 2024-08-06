// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Define Schema
const examSchema = new mongoose.Schema({
  name: String,
  date: Date,
  certification: String,
  courseType: String,
  status: String,
  score: Number,
  sessionLink: String,
});

// Create Model
const Exam = mongoose.model("Exam", examSchema);

// Define certifications and course types
const certifications = [
  "Web Development",
  "Data Science",
  "Machine Learning",
  "Cloud Computing",
  "Cybersecurity",
];

const courseTypes = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Specialization",
  "Professional Certificate",
];

const statuses = ["Passed", "Failed"];

// Generate dummy data
const generateDummyData = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Candidate ${i + 1}`,
    date: new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    ),
    certification:
      certifications[Math.floor(Math.random() * certifications.length)],
    courseType: courseTypes[Math.floor(Math.random() * courseTypes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    score: Math.floor(Math.random() * 41) + 60, // Score between 60 and 100
    sessionLink: `https://example.com/session${i + 1}`,
  }));
};

// Insert dummy data if the collection is empty
async function insertDummyData() {
  const count = await Exam.countDocuments();
  if (count === 0) {
    const dummyData = generateDummyData(50);
    await Exam.insertMany(dummyData);
    console.log("Dummy data inserted");
  }
}

insertDummyData();

// Get all exam data
app.get("/api/examdata", async (req, res) => {
  const examData = await Exam.find();
  res.json(examData);
});

// Get certifications
app.get("/api/certifications", (req, res) => {
  res.json(certifications);
});

// Get course types
app.get("/api/coursetypes", (req, res) => {
  res.json(courseTypes);
});

// Add new exam data
app.post("/api/examdata", async (req, res) => {
  const newExam = new Exam(req.body);
  await newExam.save();
  res.status(201).json(newExam);
});

// Calculate rankings
app.get("/api/rankings", async (req, res) => {
  const examData = await Exam.find({ status: "Passed" }).sort({ score: -1 });
  const rankings = examData.map((data, index) => ({
    ...data.toObject(),
    rank: index + 1,
  }));
  res.json(rankings);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
