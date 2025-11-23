# Website Architecture

This document outlines the architecture of the website, detailing the frontend and backend components, how they interact, and the overall functionality.

## Project Overview

The project is a modern web application built with a clear separation between the frontend and backend. The frontend is a Single Page Application (SPA) that communicates with a Supabase backend.

## Architecture

### Frontend (User Interface)

The frontend is built using a modern JavaScript stack:

*   **Framework**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/) for building the user interface.
*   **Build Tool**: [Vite](https://vitejs.dev/) for fast development and optimized builds.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling, along with [shadcn/ui](https://ui.shadcn.com/) for a set of reusable UI components.
*   **Routing**: [React Router](https://reactrouter.com/) (`react-router-dom`) is used to handle client-side routing and navigation between different pages.
*   **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest) (`@tanstack/react-query`) is used for managing asynchronous data fetching, caching, and state synchronization with the backend.

#### Key Directories:

*   `src/pages`: Contains the main pages of the application, such as the dashboard, product details, and user profile.
*   `src/components`: Contains reusable UI components that are used across different pages.
*   `src/App.tsx`: The main application component that sets up the routing and overall layout.

### Backend

The backend is powered by [Supabase](https://supabase.com/), a Backend-as-a-Service (BaaS) platform that provides a suite of tools for building applications:

*   **Database**: A [PostgreSQL](https://www.postgresql.org/) database is used for data storage. The database schema is managed through SQL migration files located in the `supabase/migrations` directory.
*   **Authentication**: Supabase provides a complete user authentication system, including sign-up, sign-in, and user management.
*   **Data API**: Supabase automatically generates a RESTful API for the database, which is used by the frontend to interact with the data.

### Combined Architecture

The frontend and backend are decoupled and communicate via an API.

*   The frontend is a client-side application that runs in the user's browser.
*   It interacts with the Supabase backend through the Supabase client library (`@supabase/supabase-js`).
*   The Supabase client is initialized in `src/integrations/supabase/client.ts` with the project's URL and a public API key.
*   All communication between the frontend and backend happens over HTTPS, ensuring secure data transfer.

## How the Website Works

1.  **User Authentication**: A user can sign up for a new account or sign in with an existing one. Supabase handles the authentication process.
2.  **Data Fetching**: Once authenticated, the user can access different parts of the application. The frontend uses TanStack Query to fetch data from the Supabase database, such as products, categories, and user profiles.
3.  **UI Rendering**: The fetched data is then rendered in the UI using React components.
4.  **User Interaction**: The user can interact with the application, for example, by adding a new product or updating their profile. These actions trigger API calls to the Supabase backend to update the data in the database.

## Key Functions

While it's not feasible to list every function, here are some of the key areas of functionality:

*   **`App` component (`src/App.tsx`)**: The root component that defines the application's routes and layout.
*   **Page Components (`src/pages/`)**: Each file in this directory represents a different page of the application and contains the logic for that page.
*   **UI Components (`src/components/`)**: These are reusable components that encapsulate specific UI elements and functionality.
*   **Supabase Client (`src/integrations/supabase/client.ts`)**: This file initializes the Supabase client, which is the primary interface for communicating with the backend.
*   **Database Migrations (`supabase/migrations/`)**: These files define the database schema and are used to keep the database structure in sync with the application's requirements.

The `qwen-code` directory appears to be a separate project and its exact relationship with the main application is not fully clear from the initial analysis.
