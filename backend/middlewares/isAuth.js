import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  try {
    const token = req.cookies.token; // token should be stored in a cookie

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify token
    req.userId = decoded.id; // Make sure you store `id` in the token payload during login/signup
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default isAuth;
