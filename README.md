# Fellowship Program Application Form

A Next.js application for managing fellowship program applications with an admin dashboard.

## Features

- Multi-step application form with responsive design
- Form validation using React Hook Form
- File upload capability for CV/Resume
- Admin dashboard to view and manage applications
- Status tracking for applications (pending, reviewed, approved, rejected)
- SQLite database with Prisma ORM

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd fellowship-program
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up the database

```bash
npx prisma generate
npx prisma migrate dev
```

4. Run the development server

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application form

## Admin Dashboard

The admin dashboard is protected with Basic Authentication:

- Username: `admin`
- Password: `adminpass123`

To access the admin dashboard, go to [http://localhost:3000/admin](http://localhost:3000/admin)

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and configuration
- `/prisma` - Database schema and migrations
- `/public` - Static assets

## Environment Variables

For production, you should set up environment variables in a `.env.local` file. Example:

```
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## Deployment

This application can be deployed on Vercel, Netlify, or any platform that supports Next.js applications.

```bash
npm run build
# or
yarn build
```

## Customization

- Update the form fields in `components/application-form.tsx`
- Modify the database schema in `prisma/schema.prisma`
- Change the admin authentication in `middleware.ts`

## License

This project is licensed under the MIT License.

## Database Configuration

The application is configured to use SQLite for local development. This makes it easy to get started without having to install and configure a separate database server.

### Local Development with SQLite

The database file is located at `prisma/dev.db`. You can view and manage the database using Prisma Studio:

```bash
npx prisma studio
```

This will open a web interface at http://localhost:5555.

### Production Configuration

For production, the application can be configured to use PostgreSQL. See `LOCAL_DB_SETUP.md` for instructions on how to switch between SQLite and PostgreSQL.
