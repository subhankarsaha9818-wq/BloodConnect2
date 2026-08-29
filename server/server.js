const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const newsletterRoutes = require("./routes/newsletterRoutes");
require("dotenv").config();


const chatRoutes = require("./routes/chatRoutes");
const express = require("express");
const adminRoutes = require("./routes/adminRoutes");
const mongoose = require("mongoose");
const notificationRoutes = require("./routes/notificationRoutes");
const cors = require("cors");



const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const contactRoutes = require("./routes/contactRoutes");

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/donors", require("./routes/donorRoutes"));
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/chat", chatRoutes);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
