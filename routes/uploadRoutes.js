const express = require("express");
const multer = require("multer");
const { bulkUpload } = require("../controllers/uploadController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/bulkupload", upload.single("file"), bulkUpload);

module.exports = router;
