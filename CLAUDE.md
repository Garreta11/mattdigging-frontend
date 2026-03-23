# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start development server (CRA dev server)
npm run build      # Production build (CI=false to ignore warnings)
npm test           # Run tests with react-scripts
```

The backend API runs separately at `http://localhost:3333` (set via `REACT_APP_API_URL`).

## Architecture

This is a **Create React App** project (TypeScript, React 19) for a music discovery platform called Mattdigging.

### Key Technologies
- **Routing:** React Router v7 with nested routes
- **Auth & DB:** Supabase (`src/lib/supabase.ts`)
- **Styling:** SCSS with CSS variables and responsive breakpoints (`_breakpoints.scss`)
- **Animations:** GSAP, Lenis (smooth scroll), SplitType, Three.js (3D room)
- **Payments:** Stripe (via backend billing endpoints)

### Global State — `AppContext`
`src/context/AppContext.tsx` is the single source of truth. It holds:
- Authenticated user + Supabase session
- Current playing track and player track list
- Playlists, selections, moods data
- Modal open states (`isSearchModalOpen`, `isArtistModalOpen`, `isTrackModalOpen`)
- Fullscreen state

Access it everywhere with the `useAppContext()` hook.

### API Layer — `src/services/api.ts`
All backend calls go through this file. The backend REST API handles tracks, artists, genres, moods, selections, and Stripe billing. Supabase is used directly only for auth and the `user_favorites` table.

### Routing — `src/index.tsx`
- Public routes: `/auth/confirm`, `/auth/reset-password`, `/terms`
- Main app routes (wrapped in `RequireAuth`): `/`, `/hidden-gems`, `/artists`, `/playlists`, `/selections`, `/profile`, `/about`, `/login`
- `/admin` has its own layout

### Component Conventions
- Each component lives in its own folder: `ComponentName/ComponentName.tsx` + `ComponentName.scss`
- Navigation uses a `handleNavigate` pattern that triggers fade-out/fade-in transitions before route changes
- Modals are centrally managed in `src/components/Modals/` and toggled via AppContext flags

### Custom Hooks
- `useFavorites` — manages user favorites with optimistic updates against Supabase `user_favorites` table
- `useIsMobile` — window resize listener for responsive behavior
- `useStorageUrl` — generates signed URLs from Supabase storage

### Subscription & Access Control
Tracks have free vs. paid tiers. `MembersOnly` component gates paid content. User subscription data lives in Supabase user metadata (`is_member`, subscription fields). Billing flows go through backend `/billing/checkout` and `/billing/portal` endpoints.

### Environment Variables
```
REACT_APP_SUPABASE_URL
REACT_APP_SUPABASE_ANON_KEY
REACT_APP_API_URL   # Backend API base URL (http://localhost:3333 for dev)
```
