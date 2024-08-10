const Exam = require("../models/examModel");

const courseTypes = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Specialization",
  "Professional Certificate",
  "Expert",
];

const statuses = ["Passed", "Failed"];

const generateDummyData = (count) => {
  return Array.from({ length: count }, (_, i) => {
    const score = Math.floor(Math.random() * 41) + 60;
    const totalScore = Math.floor(Math.random() * 21) + 80;
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

const insertDummyData = async () => {
  const count = await Exam.countDocuments();
  if (count === 0) {
    const dummyData = generateDummyData(50);
    await Exam.insertMany(dummyData);
    console.log("Dummy data inserted");
  }
};

const getAllExams = async (req, res) => {
  const examData = await Exam.find();
  res.json(examData);
};

const addNewExam = async (req, res) => {
  const newExam = new Exam(req.body);
  await newExam.save();
  res.status(201).json(newExam);
};

const getCourseTypes = (req, res) => {
  res.json(courseTypes);
};

const calculateRankings = async (req, res) => {
  const courseLevelScores = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
    Specialization: 4,
    "Professional Certificate": 5,
    Expert: 6,
  };

  const examData = await Exam.find({ status: "Passed" });

  const rankedData = examData.map((data) => ({
    ...data.toObject(),
    compositeScore: data.score,
    courseLevel: courseLevelScores[data.courseType] || 0,
    percentage: (data.score / data.totalScore) * 100,
  }));

  rankedData.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    if (b.courseLevel !== a.courseLevel) {
      return b.courseLevel - a.courseLevel;
    }
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return a.name.localeCompare(b.name);
  });

  const rankedList = rankedData.map((data, index) => ({
    ...data,
    rank: index + 1,
  }));

  res.json(rankedList.slice(0, 30));
};

module.exports = {
  insertDummyData,
  getAllExams,
  addNewExam,
  getCourseTypes,
  calculateRankings,
};
