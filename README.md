# Rink Relay

A professional hockey tournament management platform built with Next.js, TypeScript, and Supabase.

## 🏒 Overview

Rink Relay is a comprehensive tournament management system designed for hockey teams, coaches, and organizers. The platform enables seamless team creation, tournament organization, and real-time communication between all participants.

## ✨ Features

### For Players
- Join teams using unique join codes
- View team information and members
- Participate in tournaments
- Access tournament feeds and updates

### For Coaches
- Create and manage multiple teams
- Generate team join codes
- Register teams for tournaments
- Monitor team performance and engagement

### For Organizers
- Create and manage tournaments
- Set tournament dates, locations, and details
- Generate tournament join codes
- Oversee tournament participation

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Magic link authentication
- **Deployment**: Vercel-ready

## 🏗 Project Structure

```
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Button, Card, Input)
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries and configurations
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── constants/            # Application constants
└── public/               # Static assets
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd rink-relay
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
```

Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🎨 Design System

The application uses a custom design system with:
- **Color Palette**: Professional blues, teals, and grays
- **Typography**: Geist font family for modern readability
- **Components**: Consistent button, card, and input styles
- **Animations**: Smooth transitions and loading states
- **Responsive**: Mobile-first design approach

## 🔧 Development

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Consistent file structure and naming conventions
- Custom hooks for reusable logic
- Utility functions for common operations

### Key Features
- **Skeleton Loading**: Professional loading states
- **Client-side Caching**: Optimized performance
- **Error Handling**: Comprehensive error management
- **Responsive Design**: Works on all devices
- **Accessibility**: WCAG compliant components

## 📱 User Experience

- **Magic Link Authentication**: Passwordless login
- **Role-based Access**: Different dashboards for different user types
- **Real-time Updates**: Live tournament feeds
- **Intuitive Navigation**: Clear user flows
- **Professional UI**: Clean, modern interface

## 🚀 Deployment

The application is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main

## 🤝 Contributing

This project follows industry best practices:
- Modular component architecture
- Type-safe development
- Consistent code formatting
- Comprehensive error handling
- Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
