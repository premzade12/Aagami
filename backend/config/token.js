import jwt from "jsonwebtoken";

const genToken = (userId) => {
  try {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });
    return token;
  } catch (error) {
    console.error("Token generation error:", error.message);
    return null;
  }
};

export default genToken;
