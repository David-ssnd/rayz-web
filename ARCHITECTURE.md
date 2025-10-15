# 🏗️ RayZ Web Stack Architecture

## 📊 High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RayZ Web Monorepo                        │
│                   (Turborepo + pnpm)                        │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼───┐          ┌────▼────┐       ┌─────▼─────┐
    │  Apps │          │ Packages│       │  Config   │
    └───┬───┘          └────┬────┘       └─────┬─────┘
        │                   │                   │
   ┌────┴────┐         ┌────┴────┐        ┌────┴────┐
   │Frontend │Backend │   UI    │Types   │ESLint   │TS
   └─────────┴────────┴─────────┴────────┴─────────┴────┘
```

---

## 🎯 Monorepo Structure

### **Root Level** (`web/`)
- **Turborepo**: Orchestrates builds, tests, and dev servers
- **pnpm Workspaces**: Manages dependencies and linking
- **Shared Configs**: ESLint, Prettier, TypeScript

```
web/
├── apps/              ← Your applications
├── packages/          ← Shared libraries
├── node_modules/      ← Dependencies
├── package.json       ← Root package (scripts)
├── pnpm-workspace.yaml ← Workspace definition
└── turbo.json        ← Build pipeline config
```

---

## 🚀 Applications (`apps/`)

### 1️⃣ **Frontend** (`apps/frontend`)

**Purpose**: User-facing web application  
**Port**: `http://localhost:3000`

#### Tech Stack:
- **Framework**: Next.js 14+ with App Router
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui (planned)
- **Type Safety**: TypeScript
- **State Management**: React hooks (can add Zustand/Redux later)

#### Structure:
```
apps/frontend/
├── src/
│   └── app/
│       ├── layout.tsx     ← Root layout
│       ├── page.tsx       ← Home page
│       └── globals.css    ← Global styles
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

#### Key Features:
- **Server-Side Rendering (SSR)** for SEO and performance
- **Client-Side Navigation** with Next.js routing
- **Hot Module Replacement** for instant updates
- **Optimized Images & Fonts** via Next.js built-ins

#### Dependencies:
- `next`: Framework
- `react`: UI library
- `@rayz/ui`: Shared components from packages
- `@rayz/types`: Shared TypeScript types

---

### 2️⃣ **Backend** (`apps/backend`)

**Purpose**: REST API & Database management  
**Port**: `http://localhost:3001`

#### Tech Stack:
- **Framework**: Next.js 14+ API Routes
- **Database**: PostgreSQL (cloud via Neon)
- **ORM**: Prisma
- **Type Safety**: TypeScript + Zod validation
- **API Pattern**: RESTful (can add tRPC later)

#### Structure:
```
apps/backend/
├── src/
│   └── app/
│       ├── api/
│       │   └── health/
│       │       └── route.ts  ← Health check endpoint
│       ├── layout.tsx
│       └── page.tsx
├── prisma/
│   └── schema.prisma        ← Database schema
├── package.json
├── next.config.js
└── .env.example
```

#### Key Features:
- **API Routes**: `/api/*` endpoints
- **Database Migrations**: Prisma schema versioning
- **Type-Safe Queries**: Generated Prisma Client
- **Connection Pooling**: Built-in with Prisma

#### Current Endpoints:
- `GET /api/health` - Health check

#### Database Schema (Prisma):
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Target {
  id        String   @id @default(cuid())
  name      String
  status    String   @default("inactive")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Weapon {
  id        String   @id @default(cuid())
  name      String
  status    String   @default("inactive")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 📦 Shared Packages (`packages/`)

### 1️⃣ **@rayz/ui** (`packages/ui`)

**Purpose**: Reusable React components  
**Type**: Internal library

#### What it contains:
- Shared UI components (buttons, forms, cards, etc.)
- Built with React + TypeScript
- Styled with TailwindCSS
- Based on shadcn/ui patterns

#### Example:
```tsx
// packages/ui/src/components/button.tsx
export const Button = ({ children, variant, size }) => {
  return <button className={...}>{children}</button>
}

// Usage in frontend:
import { Button } from '@rayz/ui';
<Button variant="primary">Click me</Button>
```

---

### 2️⃣ **@rayz/types** (`packages/types`)

**Purpose**: Shared TypeScript types and interfaces  
**Type**: Internal library

#### What it contains:
- Type definitions shared between frontend and backend
- Ensures type consistency across apps

#### Example:
```typescript
// packages/types/src/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Target {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

// Usage:
import { User, Target } from '@rayz/types';
```

---

### 3️⃣ **@rayz/eslint-config** (`packages/eslint-config`)

**Purpose**: Shared ESLint rules  
**Type**: Configuration package

Ensures consistent code quality across all apps and packages.

---

### 4️⃣ **@rayz/typescript-config** (`packages/typescript-config`)

**Purpose**: Shared TypeScript configurations  
**Type**: Configuration package

Contains:
- `base.json` - Base TypeScript config
- `nextjs.json` - Next.js specific config
- `react-library.json` - React library config

---

## ⚡ How It All Works Together

### 1. **Development Workflow**

```bash
pnpm dev
```

**What happens:**
1. Turborepo reads `turbo.json`
2. Identifies all apps with `dev` script
3. Runs `frontend:dev` and `backend:dev` in parallel
4. Watches for changes in `packages/*`
5. Auto-rebuilds when shared packages change
6. Hot reloads both apps

### 2. **Dependency Linking**

```json
// apps/frontend/package.json
{
  "dependencies": {
    "@rayz/ui": "workspace:*",      ← Links to local package
    "@rayz/types": "workspace:*"    ← Not from npm!
  }
}
```

pnpm creates **symlinks**:
- `apps/frontend/node_modules/@rayz/ui` → `packages/ui`
- Changes in `packages/ui` instantly available in `apps/frontend`

### 3. **Build Pipeline**

```bash
pnpm build
```

**Execution order (Turborepo):**
1. Build `@rayz/types` (no dependencies)
2. Build `@rayz/ui` (depends on types)
3. Build `frontend` (depends on ui + types)
4. Build `backend` (depends on types)

```
       ┌─────────┐
       │  types  │
       └────┬────┘
            │
     ┌──────┴──────┐
     │             │
┌────▼────┐   ┌────▼────┐
│   ui    │   │ backend │
└────┬────┘   └─────────┘
     │
┌────▼────┐
│frontend │
└─────────┘
```

### 4. **Type Safety Flow**

```
┌──────────────────────────────────────────┐
│  1. Define types in @rayz/types          │
│     interface User { id: string }        │
└──────────────┬───────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
┌───────▼──────┐ ┌────▼─────────┐
│ 2. Backend   │ │ 3. Frontend  │
│    uses User │ │    uses User │
│    in API    │ │    in UI     │
└──────────────┘ └──────────────┘
     │                  │
     └────────┬─────────┘
              ▼
   ✅ Type-safe end-to-end!
```

---

## 🔧 Key Technologies Explained

### **Turborepo**
- **What**: Build system for monorepos
- **Why**: Parallel builds, smart caching, task orchestration
- **Benefit**: Fast builds, only rebuilds what changed

### **pnpm**
- **What**: Fast, disk-efficient package manager
- **Why**: Symlinks packages, saves disk space
- **Benefit**: Faster installs, no duplication

### **Next.js 14+**
- **What**: React framework with SSR, API routes, routing
- **Why**: Full-stack framework (frontend + backend)
- **Benefit**: SEO, performance, developer experience

### **Prisma**
- **What**: Type-safe ORM for databases
- **Why**: Auto-generated types, migrations, type safety
- **Benefit**: No SQL injection, great DX

### **TailwindCSS**
- **What**: Utility-first CSS framework
- **Why**: Fast styling, consistent design system
- **Benefit**: No context switching, small bundle size

---

## 🌊 Data Flow Example

**User clicks button in Frontend → API call → Backend → Database**

```
┌──────────────┐
│   Browser    │
│  localhost:  │
│     3000     │
└──────┬───────┘
       │ 1. User action
       │
┌──────▼───────────────────────┐
│   Frontend (Next.js)         │
│   - React component          │
│   - Uses @rayz/types         │
│   - Uses @rayz/ui Button     │
└──────┬───────────────────────┘
       │ 2. fetch('http://localhost:3001/api/targets')
       │
┌──────▼───────────────────────┐
│   Backend (Next.js API)      │
│   - Route handler            │
│   - Uses @rayz/types         │
│   - Validates with Zod       │
└──────┬───────────────────────┘
       │ 3. prisma.target.findMany()
       │
┌──────▼───────────────────────┐
│   PostgreSQL (Neon)          │
│   - Stores data              │
│   - Returns results          │
└──────────────────────────────┘
```

---

## 🎨 Frontend + Backend Interaction

### Example: Fetching Targets

**Backend API** (`apps/backend/src/app/api/targets/route.ts`):
```typescript
import { prisma } from '@/lib/prisma';
import { Target } from '@rayz/types';

export async function GET() {
  const targets: Target[] = await prisma.target.findMany();
  return Response.json(targets);
}
```

**Frontend Component** (`apps/frontend/src/app/page.tsx`):
```typescript
import { Target } from '@rayz/types';
import { Button } from '@rayz/ui';

export default async function Page() {
  const res = await fetch('http://localhost:3001/api/targets');
  const targets: Target[] = await res.json();
  
  return (
    <div>
      {targets.map(target => (
        <div key={target.id}>
          <h2>{target.name}</h2>
          <Button>Activate</Button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 Why This Architecture?

### ✅ **Advantages**

1. **Code Reusability**
   - Shared components (`@rayz/ui`)
   - Shared types (`@rayz/types`)
   - No duplication!

2. **Type Safety**
   - End-to-end TypeScript
   - Frontend knows backend's API shape
   - Catch errors at compile time

3. **Fast Development**
   - Hot reload on all apps
   - Instant updates from shared packages
   - Parallel builds with Turborepo

4. **Scalability**
   - Easy to add more apps (mobile admin panel?)
   - Easy to add more packages (utils, hooks)
   - Independent deployment possible

5. **Single Source of Truth**
   - One repo for all web code
   - Shared dependencies
   - Consistent versioning

---

## 📝 Summary

Your RayZ web stack is a **modern, type-safe, full-stack monorepo** that:

- Uses **Next.js** for both frontend and backend
- Shares code via **Turborepo + pnpm workspaces**
- Ensures type safety with **TypeScript + Prisma**
- Styles with **TailwindCSS**
- Stores data in **PostgreSQL**
- Builds fast with **Turborepo caching**

**It's designed for:**
- Fast development
- Type safety
- Code reuse
- Easy scaling
- Great developer experience

🎯 **Next steps**: Add more UI components, connect to real database, implement authentication!
