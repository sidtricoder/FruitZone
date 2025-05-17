# FruitZone Frontend

This is the frontend portion of the FruitZone application. It's designed to work with the backend API deployed at `https://server-orcin-beta.vercel.app`.

## Development

To run the frontend in development mode:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Building for Production

To build the frontend for production:

```bash
# Install dependencies
npm install

# Build for production
npm run build
```

The build output will be in the `dist` directory.

## Deployment on Render

This frontend is configured for easy deployment on Render:

1. Connect your GitHub repository
2. Set the following in Render's dashboard:
   - Root Directory: `/` (the frontend directory itself)
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

## Environment Variables

The following environment variables can be set:

- `VITE_BACKEND_URL`: The URL of the backend API (default is `https://server-orcin-beta.vercel.app`)

## API Routing

In production, API requests are routed to the backend using the configuration in `vercel.json`.
