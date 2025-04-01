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
- `npm run lint` - Run ESLint to check code quality

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

## Code Quality
The project includes ESLint for maintaining code quality and consistency. Run the linting check with:
```bash
npm run lint
