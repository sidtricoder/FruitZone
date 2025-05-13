import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/database'; // Import connectDB
import authRoutes from './routes/authRoutes'; // Import auth routes

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Initialize DB Connection
connectDB(); // Call connectDB here

// Basic Route
app.get('/', (req: Request, res: Response) => {
  res.send('FruitZone Backend Server is Running!');
});

// API Routes
app.use('/api/auth', authRoutes); // Use auth routes

// TODO: Add other routes (products, cart, orders)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app; // For Vercel deployment
