import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import authenticateJWT from "./middlewares/authenticateJWT";

const router = express.Router();

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}
const validateUser = (req: Request, res: Response, next: NextFunction) => {
    if ((!req.body.name) || (!req.body.email) || (!req.body.password)) {
        return res.status(400).json({ error: "Empty Body not allowed" });
    }
    next();
};

const usersDetails: User[] = require("../usersDetails.json");

router.post("/userSignup", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const User = usersDetails.find(u => u.email === email);
  if (User) return res.status(400).send({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser: User = {
    id: uuidv4(),
    name,
    email,
    password: hashedPassword,
  };

  usersDetails.push(newUser);
        fs.writeFile('./usersDetails.json', JSON.stringify(usersDetails), (err) => {
            if (err) {
                return res.status(500).json({ error: "Error saving user data" });
            }
            return res.status(201).send({
                message: "User Signup Successfully",
                  data: { id: newUser.id,
                     name: newUser.name, 
                     email: newUser.email },
            });
        });
    });

router.post("/userLogin", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = usersDetails.find((u: User) => u.email === email);
  if (!user) return res.status(401).send({ message: "User not found" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(401).send({ message: "Invalid password" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).send({ message: "JWT_SECRET is not defined" });

  const token = jwt.sign({
     id: user.id,
      email: user.email
     }, secret,
    { expiresIn: "1d" });

  return res.status(200).send({ message: "Login successful", token });
});

 router.put("/user/:id", validateUser, (req, res) => {
    const id = req.params.id;
    const userIndex = usersDetails.findIndex((user) => user.id === id);
    if (userIndex === -1) return res.status(404).send("User not found");

    const updatedUser = req.body;
    usersDetails[userIndex] = { id, ...updatedUser };

    fs.writeFile("./usersDetails.json", JSON.stringify(usersDetails), (err) => {
        if (err) return res.status(500).send("Error saving user data");
        return res.json(usersDetails[userIndex]);
    });
});

router.delete("/user/:id", (req, res) => {
    const id = req.params.id;
    const userIndex = usersDetails.findIndex((user) => user.id === id);
    if (userIndex === -1) return res.status(404).send("ID not found");

    usersDetails.splice(userIndex, 1);

    fs.writeFile('./usersDetails.json', JSON.stringify(usersDetails), (err) => {
        if (err) return res.status(500).send("Error deleting user");
        return res.json({ status: "Deleted Successfully" });
    });
});

router.get("/product", authenticateJWT, (req: any, res: Response) => {
  res.send({ message: `Hello ${req.user.email}, you can access this protected route!` });
});

export default router;
