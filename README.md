# Jiveesha ECD Platform

![Platform Overview](https://img.shields.io/badge/Status-Beta-blue)
![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?logo=next.js)
![Database Supabase](https://img.shields.io/badge/Backend-Supabase-green?logo=supabase)

A comprehensive Early Childhood Development (ECD) management platform designed to streamline child registration, developmental screening, and administrative oversight for state-wide programs.

## 🌟 Overview

The Jiveesha ECD Platform empowers Anganwadi Workers (AWW), supervisors, and state officials with real-time data to monitor and improve child development outcomes. It bridges the gap between ground-level screening and administrative decision-making through a robust, scalable digital infrastructure.

## 🚀 Key Features

### 👥 User & Role Management
- **Hierarchical RBAC**: Fine-grained permissions for AWWs, Screeners, CDPOs, DPOs, and Admins.
- **Bulk Operations**: High-speed CSV imports, batch assignments to geographic units, and system-wide bulk actions.
- **Dynamic Role Mapping**: Real-time permission updates across the interface based on role definitions.

### 📍 Geographic Hierarchy
- **Structured Mapping**: Management of Districts, Mandals (Projects), and Anganwadi Centers (AWC).
- **Auto-Cascading Selectors**: Intelligent filtering of geographic units across the platform.

### 📋 Screening & Tracking
- **Child Registration**: Comprehensive profiles for children and caregivers.
- **Developmental Screening**: Support for AI-driven protocols and standard questionnaires.
- **Risk Scoring**: Automated risk assessment based on screening results.

### 🔐 Security & Oversight
- **Audit Logging**: Comprehensive tracking of all administrative actions for transparency.
- **Supabase Integration**: Secure authentication and Row-Level Security (RLS) for data protection.
- **Server Actions**: Secure, server-side data mutations with built-in validation.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Styling**: Vanilla CSS with modern flex/grid layouts and premium aesthetics.
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **Icons**: Custom optimized SVGs for performance and zero-dependency reliability.

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn
- A Supabase Project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Daira-Edtech/AP-PLATFORM.git
   cd AP-PLATFORM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🔑 Portal Login Credentials

### Super Admin Portal (`/admin`)
| Email | Password | Role |
|-------|----------|------|
| `admin@jiveesha.com` | `password123` | Super Admin |
| `system@jiveesha.com` | `password123` | System Admin |

### Commissioner Portal (`/commissioner`)
| Email | Password | Role |
|-------|----------|------|
| `commissioner@jiveesha.com` | `password123` | Commissioner |

### DPO Portal (`/dpo`)
| Email | Password | Role |
|-------|----------|------|
| `dpo@jiveesha.com` | `password123` | District Officer |

### CDPO Portal (`/cdpo`)
| Email | Password | Role |
|-------|----------|------|
| `cdpo@jiveesha.com` | `password123` | CDPO |

> **Note:** Run `npm run seed:admins` to create the admin users. For Commissioner, DPO, and CDPO accounts, create them via the Admin Portal or update the seed script.

## 🏗️ Project Structure

```text
src/
├── app/               # Next.js App Router (Pages, API Routes, Layouts)
├── components/        # Reusable UI components
│   ├── admin/         # Management-specific components (UserTable, BulkOps, etc.)
│   └── shared/        # Cross-platform components
├── lib/               # Utilities, Supabase clients, and Types
└── middleware.ts      # Authentication and routing protection
```

## 📜 Administrative Commands

- **Seed Admin Users**:
  ```bash
  npm run seed:admins
  ```

## 🛡️ License

This project is proprietary and confidential. Unauthorized copying of this file, via any medium, is strictly prohibited.

---
© 2026 Jiveesha. All rights reserved.
