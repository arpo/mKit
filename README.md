# TypeScript Boilerplate

## Prerequisites
- Node.js and npm installed on your system

## Setup
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Development
The project uses TypeScript for both frontend and server-side development, with the following structure:
- Frontend TypeScript source files are in `src/ts/`
- Server TypeScript source file is in `src/server.ts`
- Compiled JavaScript files output to `public/js/`

To start development with hot-reloading:
```bash
npm run dev
```

This command will:
- Start the Node.js server with automatic reloading
- Launch browser-sync for live reloading
- Watch and compile TypeScript files automatically

## Available Scripts
- `npm run dev` - Start development environment with hot-reloading
- `npm run server` - Start the Node.js server only
- `npm run client` - Start browser-sync only
- `npm run ts:watch` - Watch and compile TypeScript files
- `npm run build` - Build both server and client for production
- `npm run start` - Start the production server (after building)
- `npm run format` - Format code using Prettier
- `npm run deploy` - Deploy to Google Cloud Run (builds, submits to Cloud Build, and deploys to Cloud Run)

## Project Structure
```
├── public/              # Static files served to client
│   ├── css/            # CSS styles
│   ├── js/             # Compiled JavaScript
│   └── index.html      # Main HTML file
├── src/
│   ├── ts/             # Frontend TypeScript source files
│   └── server.ts       # TypeScript server
├── tsconfig.json       # TypeScript configuration for frontend
├── tsconfig.server.json # TypeScript configuration for server
├── eslint.config.js    # ESLint configuration
├── browser-sync.config.cjs # Browser-sync configuration
├── nodemon.json        # Nodemon configuration for server auto-reload
└── package.json        # Project dependencies and scripts
```

## Deployment to Google Cloud Run

### Option 1: Using Cline (Recommended as of April 2025)

The easiest way to deploy is using Cline (Note: Use Sonnet, as Google Gemini doesn't run commands for you). Send this prompt to Cline:

```
Setting up this project on GCP. 

Here's my new project:
Project number: <your-project-number>
Project ID: <your-project-id>

Here's a guide you created to me on how to do it:
DEPLOY-FROM-SCRATCH-GUIDE.md

I want you to help me get this project up and running on GCP. Read the guide and help me through.
```

Cline will guide you through the entire process, handling all the necessary GCP setup and deployment steps.

### Option 2: Manual Setup and Deployment

If you prefer to handle the deployment manually:

1. **First-Time Setup:**
   If this is your first time deploying the project, follow the complete setup guide in `DEPLOY-FROM-SCRATCH-GUIDE.md`. This includes:
   - Enabling required GCP APIs
   - Creating an Artifact Registry repository
   - Setting up service accounts and permissions
   - Configuring your local environment

2. **Regular Deployment:**
   After the initial setup is complete, you can deploy using:
   ```bash
   npm run deploy
   ```
   This command:
   - Builds the application (server + client)
   - Submits the build to Cloud Build
   - Deploys the service to Cloud Run

## GCP Resources

The project uses the following GCP resources (configured during initial setup):
- Cloud Run for serverless hosting
- Cloud Build for building Docker images
- Artifact Registry for storing Docker images
- IAM & Service Accounts for security and access control

For detailed information about the GCP setup and deployment process, refer to `DEPLOY-FROM-SCRATCH-GUIDE.md`.
