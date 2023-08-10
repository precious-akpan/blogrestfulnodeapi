const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization')
  if (!authHeader) {
    const error = new Error('Unauthorized request')
    error.statusCode = 401
    throw error
  }
  const token = authHeader.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "sophisticatedsecretkey");
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
      e.message = "Invalid token";
      throw e;
    }
  }

  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId
  next()
};
