const excelDateToJSDate = (serial) => {
  if (serial === null || serial === undefined) return null;
  const utcDays = serial - 25569;
  const utcDate = utcDays * 86400;
  return new Date(utcDate * 1000);
};

module.exports = { excelDateToJSDate };
