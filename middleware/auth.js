const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get();
  if (!authHeader) {
    const error = new Error("Not authenticated.");
    req.isAuth = false;
    throw error;
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "supersecretsecretkey");
  } catch (e) {
    if (!e.statusCode) {
      req.isAuth = false;
      // return next();
      throw e
    }
  }

  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  req.userId = decodedToken.userId;
  req.isAuth = true;
  next();
};
