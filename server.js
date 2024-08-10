const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const examRoutes = require("./routes/examRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api", examRoutes);
app.use("/api", uploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
