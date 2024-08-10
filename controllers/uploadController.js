const Exam = require("../models/examModel");
const { parseCSV, parseExcel } = require("../utils/fileParser");
const fs = require("fs");

const bulkUpload = async (req, res) => {
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
    fs.unlinkSync(filePath);
  }
};

module.exports = { bulkUpload };
