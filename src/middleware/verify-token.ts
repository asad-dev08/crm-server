import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { TokenType } from "../controller/user.login.controller";

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const excludedRoutes = ["/auth/verifyLogin", "/signup"];
  if (excludedRoutes.includes(req.path)) {
    return next();
  }
  const authorizationHeader = req.header("Authorization");

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid authorization header" });
  }
  const token = authorizationHeader.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization token not found" });
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY as string
    ) as TokenType;
    (req as any).user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: "Token expired" });
    } else {
      console.error(err);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  }
};
export default verifyToken;
