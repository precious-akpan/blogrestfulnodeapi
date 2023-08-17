const express = require("express");
const auth = require("./middleware/auth");
const app = express();
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const {join} = require('path')
const fs = require("fs");
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
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use("/images", express.static(path.join(__dirname, "images")));

app.use(auth);

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || "An error occurred.";
      const code = err.originalError.code || 500;

      return { message, status: code, data };
    },
  }),
);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Unauthorized action')
  }
  if (!req.file) {
   return res.status(200).json({ message: "No file provided" });
  }

  if (req.body.oldPath) {
    clearImage(req.body.oldPath)
  }
   return res.status(201).json({message: 'File provided', filePath: req.file.path})
});
app.use((error, req, res, next) => {
  console.log("error handler middleware", error);
  res
    .status(error.statusCode || 500)
    .json({ message: error.message, data: error.data });
});
mongoose
  .connect("mongodb://localhost:27017/blog")
  .then(() => {
    app.listen(8080, () => console.log("Server running on port 8080"));
  })
  .catch((error) => console.log(error));

const clearImage = (filePath) => {
  fs.unlink(join(__dirname, filePath), err => console.log(err))
}