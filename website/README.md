# FindNest Frontend

A React-based property listing platform with interactive maps and role-based access for users, landlords, and administrators.

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Ant Design** - UI components
- **Tailwind CSS** - Styling
- **MapLibre GL** - Interactive maps
- **AWS SDK** - Location services and authentication

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# AWS Region
VITE_AWS_REGION=your-aws-region

# Cognito Configuration
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_IDENTITY_POOL_ID=your-identity-pool-id

# API Configuration
VITE_API_BASE_URL=your-api-base-url

# AWS Location Service
VITE_MAP_NAME=your-map-name
VITE_PLACE_INDEX_NAME=your-place-index-name
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (admin, landlord, user)
├── layout/         # Layout wrappers
├── redux/          # State management
├── routes/         # Routing configuration
├── services/       # API and AWS services
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── styles/         # Global styles
```

## Features

- Role-based dashboards (Admin, Landlord, User)
- Interactive property maps
- Real-time notifications
- Property listing management
- User authentication with AWS Cognito
