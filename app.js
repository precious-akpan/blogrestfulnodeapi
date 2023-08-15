const express = require("express");
const { createServer } = require("http");
const app = express();
const httpServer = createServer(app);
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
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
    return res.sendStatus(200)
  }
  next();
});

app.use("/images", express.static(path.join(__dirname, "images")));

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
