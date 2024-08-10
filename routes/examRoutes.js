const express = require("express");
const {
  getAllExams,
  addNewExam,
  getCourseTypes,
  calculateRankings,
} = require("../controllers/examController");

const router = express.Router();

router.get("/examdata", getAllExams);
router.post("/examdata", addNewExam);
router.get("/coursetypes", getCourseTypes);
router.get("/rankings", calculateRankings);

module.exports = router;
