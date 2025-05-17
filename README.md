# FruitZone

A fruit shop application with separate frontend and backend deployments.

## Project Structure

The project is split into two main directories:

- `frontend/`: Contains the React frontend application
- `backend/`: Contains the Node.js backend API

## Local Development

### Setting Up

1. Install dependencies for both projects:

```
npm run install:all
```

Or install them separately:

```
npm run install:frontend
npm run install:backend
```

### Running Locally

1. Start the backend server:

```
npm run dev:backend
```

2. In a separate terminal, start the frontend development server:

```
npm run dev:frontend
```

The frontend will be available at http://localhost:5173 and will proxy API requests to the backend at http://localhost:5002.

## Deployment

The frontend and backend are configured to be deployed separately to Vercel.

### Frontend Deployment

1. Deploy the frontend to Vercel:

```
npm run deploy:frontend
```

2. Configure environment variables in the Vercel dashboard for the frontend project:
   - Set `VITE_API_URL` to your backend deployment URL (if needed)

### Backend Deployment

1. Deploy the backend to Vercel:

```
npm run deploy:backend
```

2. Configure environment variables in the Vercel dashboard for the backend project:
   - Database connection details
   - JWT secrets
   - Other environment-specific settings

3. After deploying, update the API URL in the frontend's vercel.json file:

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://server-orcin-beta.vercel.app/api/$1"
    }
  ]
}
```

## Environment Variables

### Frontend

Create a `.env` file in the `frontend/` directory with these variables:

```
# In development, you might want to use a local URL
# VITE_API_URL=http://localhost:5002
# In production, the API URL is hardcoded in lib/config.ts to use the production URL
```

### Backend

Create a `.env` file in the `backend/` directory with these variables:

```
PORT=5002
SUPABASE_DB_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```
