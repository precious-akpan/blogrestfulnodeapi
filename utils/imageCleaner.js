const fs = require("fs");
const { join } = require("path");
const clearImage = (filePath) => {
  fs.unlink(join(__dirname, "..", filePath), (err) => console.log("err", err));
};

module.exports = clearImage;
