import express, { Request, Response,NextFunction } from "express"; 
import fs from "fs";
import authenticateJWT from "./middlewares/authenticateJWT";
import productsData from "../product.json";

const router = express.Router();

interface Product {
  name: string;
  userId: string | undefined;
}

let products: Product[] = productsData as Product[];

interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

router.post('/addProduct', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: "Product name is required" });
  }

  const newProduct: Product = {
    name,
    userId: req.user?.id
  };

  products.push(newProduct);

  fs.writeFile('./product.json', JSON.stringify(products), (err) => {
    if (err) {
      return res.status(500).send({ message: "Error saving product" });
    }
    res.status(201).send({ message: "Product added successfully", product: newProduct });
  });
});

router.get('/products/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const userProducts = products.filter(p => p.userId === userId);
  res.status(200).json(userProducts);
});

router.get('/products', (req: Request, res: Response) => {
  res.status(200).json(products);
});

router.delete('/products/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;

  const remainingProducts = products.filter(p => p.userId !== userId);

  if (remainingProducts.length === products.length) {
    return res.status(404).send({ message: "No products found for this user" });
  }

  products = remainingProducts;

  fs.writeFile('./product.json', JSON.stringify(products), (err) => {
    if (err) {
      return res.status(500).send({ message: "Error deleting products" });
    }
    res.status(200).send({ message: `deleted successfully` });
  });
});

router.put('/products/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId;
  const { name } = req.body;

  if (!name) {
    return res.status(400).send({ message: "Product name is required for update" });
  }

  const productIndex = products.findIndex(p => p.userId === userId);

  if (productIndex === -1) {
    return res.status(404).send({ message: "No product found for this user" });
  }

  products[productIndex]!.name = name;

  fs.writeFile('./product.json', JSON.stringify(products), (err) => {
    if (err) {
      return res.status(500).send({ message: "Error updating product" });
    }
    res.status(200).send({ message: "Product updated successfully", product: products[productIndex] });
  });
});

export default router;
