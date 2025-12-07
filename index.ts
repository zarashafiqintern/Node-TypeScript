import express from "express";
import userRoutes from "./routes/users";
import productRoutes from "./routes/product";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());

app.use("/", userRoutes);
app.use('/', productRoutes);

app.listen(8000, () => {
  console.log("Server Started");
});
