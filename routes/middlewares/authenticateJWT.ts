import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id: string;
  email: string;
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export default function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).send({ message: "Token is missing" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send({ message: "JWT_SECRET is not defined" });

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).send({ message: "Invalid token" });

    req.user = user as JwtPayload;
    next();
  });
}
