import jwt from "jsonwebtoken";

export const isValidUser = (req, res, next) => {
  console.log("Token----",req.cookies.token)
  const token = req.cookies.token;

  if (!token) {
      return res.status(401).json({ message: "unauthorized" });
  }
    try {
            
        //decode token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decodedToken, "=========Decoded token");

        if (!decodedToken) {
            return res.status(401).json({ message: "user not autherized" });
        }

        req.user = decodedToken;

        //check
        next();
    } catch (error) {
        console.log(error);
        res.status(error.statusCode || 500).json({ message: error.message || "Internal server" });
    }
  };