require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Set up multer for file upload
const upload = multer({ dest: "uploads/" });

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
  totalScore: Number,
  sessionLink: String,
});

// Create Model
const Exam = mongoose.model("Exam", examSchema);

// Define course types
const courseTypes = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Specialization",
  "Professional Certificate",
  "Expert",
];

const statuses = ["Passed", "Failed"];

// Generate dummy data
const generateDummyData = (count) => {
  return Array.from({ length: count }, (_, i) => {
    const score = Math.floor(Math.random() * 41) + 60; // Score between 60 and 100
    const totalScore = Math.floor(Math.random() * 21) + 80; // Total score between 80 and 100
    return {
      name: `Candidate ${i + 1}`,
      date: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ),
      certification: `Certification ${i + 1}`,
      courseType: courseTypes[Math.floor(Math.random() * courseTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      score: score,
      totalScore: totalScore,
      sessionLink: `https://example.com/session${i + 1}`,
    };
  });
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
  const courseLevelScores = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
    Specialization: 4,
    "Professional Certificate": 5,
    Expert: 6,
  };

  const examData = await Exam.find({ status: "Passed" });

  // Calculate a composite score and percentage for each exam
  const rankedData = examData.map((data) => ({
    ...data.toObject(),
    compositeScore: data.score,
    courseLevel: courseLevelScores[data.courseType] || 0,
    percentage: (data.score / data.totalScore) * 100,
  }));

  // Sort by composite score, course level, percentage, and name
  rankedData.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore; // Higher score first
    }
    if (b.courseLevel !== a.courseLevel) {
      return b.courseLevel - a.courseLevel; // Higher course level first
    }
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage; // Higher percentage first
    }
    return a.name.localeCompare(b.name); // Alphabetical order
  });

  // Assign ranks with no ties
  const rankedList = rankedData.map((data, index) => ({
    ...data,
    rank: index + 1,
  }));

  res.json(rankedList.slice(0, 30));
});


const excelDateToJSDate = (serial) => {
  if (serial === null || serial === undefined) return null;
  const utcDays = serial - 25569; // Excel's start date is 1900-01-01 (serial 1)
  const utcDate = utcDays * 86400; // Convert days to seconds
  return new Date(utcDate * 1000); // Convert seconds to milliseconds
};

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet);

  // Convert Excel date serial numbers to JavaScript Date objects
  return jsonData.map(row => {
    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'number' && key.toLowerCase().includes('date')) {
        row[key] = excelDateToJSDate(row[key]);
      } else if (typeof row[key] === 'string' && key.toLowerCase().includes('date')) {
        // Handle date strings if needed
        row[key] = new Date(row[key]);
      }
    });
    return row;
  });
}

// Bulk upload endpoint
app.post("/api/bulkupload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = req.file.path;
  const fileExt = req.file.originalname.split(".").pop().toLowerCase();

  let results = [];

  if (fileExt === "csv") {
    results = await parseCSV(filePath);
  } else if (["xlsx", "xls"].includes(fileExt)) {
    results = await parseExcel(filePath);
  } else {
    return res.status(400).json({ message: "Unsupported file format" });
  }

  try {
    await Exam.insertMany(results);
    res.json({ message: "Bulk upload successful", count: results.length });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ message: "Error uploading data" });
  } finally {
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
  }
});


// Utility function to convert date format from yyyy-mm-dd to dd-mm-yyyy
const convertDateFormat = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};


function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
