const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const { excelDateToJSDate } = require("./excelUtils");

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

function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet);

  return jsonData.map((row) => {
    Object.keys(row).forEach((key) => {
      if (typeof row[key] === "number" && key.toLowerCase().includes("date")) {
        row[key] = excelDateToJSDate(row[key]);
      } else if (
        typeof row[key] === "string" &&
        key.toLowerCase().includes("date")
      ) {
        row[key] = new Date(row[key]);
      }
    });
    return row;
  });
}

module.exports = { parseCSV, parseExcel };
