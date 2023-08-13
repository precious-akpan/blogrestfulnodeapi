const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);
const multer = require("multer");

const feedsRoutes = require("./routes/feedsRoutes");
const authRoutes = require("./routes/authRoutes");

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");

const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    callback(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    callback(null, true);
  } else callback(null, false);
};

app.use(bodyParser.json());
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  next();
});

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/feeds", feedsRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log('error handler middleware',error);
  res
    .status(error.statusCode || 500)
    .json({ message: error.message, data: error.data });
});
mongoose
  .connect("mongodb://localhost:27017/blog")
  .then(() => {
    // const server = app.listen(8080, () =>
    //   console.log("Server running on port 8080"),
    // );
    // const io = new Server(httpServer, {
    //   cors: {
    //     origin: "http://localhost:3000",
    //     credentials: true,
    //   },
    // });

    const io = require("./socket").init(httpServer);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });

    httpServer.listen(8080, () => console.log("Server running on port 8080"));
  })
  .catch((error) => console.log(error));
