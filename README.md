# Church CMS Web Application

A modern church management system focused on the home page and login functionality.

## Features

- **Home Page**: Beautiful landing page with modern UI, 3D background effects, and responsive design
- **Login Page**: Secure authentication with elegant design
- **Theme Support**: Light and dark mode toggle
- **Multi-language**: English and Amharic language support
- **Responsive**: Mobile-friendly design

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── pages/
│   ├── Home.tsx          # Main landing page
│   └── Login.tsx         # Authentication page
├── components/           # Reusable UI components
├── contexts/            # React contexts (Theme, Language)
├── hooks/               # Custom React hooks
├── services/            # API services
├── types/               # TypeScript type definitions
└── lib/                 # Utility functions
```

## Technologies

- React 18
- TypeScript
- Vite
- TailwindCSS
- Framer Motion
- React Query
- Axios
- Radix UI

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:5000
```

## Recent Changes

### Removed Shared Package Dependency

The application has been refactored to remove the `@church-cms/shared` package dependency. All shared types are now defined locally in `src/types/index.ts`. This makes the application:

- Self-contained and easier to maintain
- Simpler to deploy
- Faster to build (reduced from 910KB to 527KB)

### Simplified Routes

The application now focuses only on the Home and Login pages. All other routes redirect to the home page.

## License

Private - All rights reserved
