# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # HarvestSwap Expo app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## HarvestSwap Mobile App (`artifacts/mobile`)

A rural food-swap network mobile app built with Expo + Expo Router.

### Features
- **Onboarding**: Name + role selection (Maker / Buyer), 20 credits to start
- **Discover**: Browse available listings, filter by category, search
- **Map**: Interactive map (native) / list fallback (web) showing swap box locations with Leaflet-style markers
- **Post**: Makers post surplus produce with photo, title, description, category, quantity, location, credit cost
- **Activity**: Transaction history, credit stats
- **Profile**: Role switch, credit balance, listing management
- **Listing Detail**: Full listing view with claim flow → QR screen
- **QR Screen**: QR code for box unlock, "Simulate Box Unlock" button that logs `console.log('door open')`

### Tech Stack
- **Expo SDK 54** with Expo Router file-based routing
- **Firebase**: Installed (firebase ^12)
- **react-native-maps@1.18.0**: Native map (iOS/Android only, web uses list fallback)
- **react-native-qrcode-svg**: QR code generation
- **expo-image-picker**: Photo upload
- **expo-haptics**: Haptic feedback
- **expo-linear-gradient**: Beautiful gradients
- **AsyncStorage**: Local data persistence
- **State**: React Context (AppContext) for global state

### Color Theme
Earthy, organic palette:
- Amber (`#D4822A`) — primary tint, credits, CTAs
- Forest green (`#2D5A27`) — accent, background gradients
- Cream (`#F7F2EA`) — background
- Bark (`#5C3D2E`) — text

### Architecture
- `context/AppContext.tsx` — global state: user, listings, transactions, CRUD methods
- Demo listings are pre-seeded so the app is useful on first launch
- `claimListing()` calls `console.log('door open')` simulating hardware unlock
- Map uses `require()` pattern after Platform.OS check to avoid web bundling issues with react-native-maps

## API Server (`artifacts/api-server`)

Express 5 API server. Routes at `/api`.
