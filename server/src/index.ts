import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// import { connectDB } from './config/database'; // We'll create this soon

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// TODO: Initialize DB Connection
// connectDB();

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('FruitZone Backend Server is Running!');
});

// TODO: Add other routes (auth, products, cart, orders)
// import authRoutes from './routes/authRoutes';
// app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app; // For Vercel deployment
