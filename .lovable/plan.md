# React Native + NativeWind Mobile Port

Port the existing Align webapp into a true React Native app under `mobile/`, preserving the existing Capacitor PWA wrapper untouched. Targets 1:1 screen parity using NativeWind so the Tailwind-based design system carries over.

## Scope (1:1 parity targets)

**Worker screens**
- Home (today's shift, check-in, checklist, messaging entry)
- Shifts (upcoming list + detail)
- Shift History
- Team Directory
- Notifications
- Profile

**Manager screens**
- Dashboard (staffing health, command center, requests preview)
- Shifts (calendar + list, create, templates, auto-fill)
- Requests (swaps, call-offs, pickups + activity timeline drawer)
- Team
- Analytics
- Notifications
- Settings + Support

**Shared**
- Auth (sign in, sign up, reset password, accept invite)
- Landing is **not ported** — RN app opens straight to auth. (Landing stays web-only.)

## Architecture

```text
mobile/
  app.json                  Expo config (managed workflow)
  package.json              Separate from web, RN deps only
  babel.config.js           NativeWind preset
  metro.config.js           NativeWind + SVG transformer
  tailwind.config.js        Mirrors web tokens (HSL → rgb conversion)
  global.css                NativeWind v4 entry
  tsconfig.json
  index.ts
  src/
    App.tsx                 Providers + navigation root
    navigation/
      RootNavigator.tsx     Auth gate + role gate
      WorkerTabs.tsx        Bottom tabs (Home, Shifts, Team, Notifications, Profile)
      ManagerTabs.tsx       Bottom tabs (Dashboard, Shifts, Requests, Team, More)
      types.ts
    integrations/supabase/
      client.ts             Same URL/anon key, AsyncStorage instead of localStorage
      types.ts              Symlinked/copied from web
    contexts/AuthContext.tsx
    hooks/                  Ported 1:1 (RN-safe — no DOM)
    lib/
      queryClient.ts
      formatTime.ts
      haptics.ts            expo-haptics adapter
      utils.ts              cn()
    components/
      ui/                   RN equivalents: Button, Card, Input, Sheet, Dialog, etc.
      ...feature components
    screens/
      auth/                 SignIn, SignUp, ResetPassword, AcceptInvite
      worker/               Home, Shifts, History, Team, Notifications, Profile
      manager/              Dashboard, Shifts, Requests, Team, Analytics, Notifications, Settings, Support, AutoFill
    theme/
      tokens.ts             Color tokens converted from index.css
      ThemeProvider.tsx     light/dark/system
```

## Tech choices

| Concern | Choice | Why |
|---|---|---|
| Runtime | **Expo SDK 51 (managed)** | Fast iteration, OTA, no Xcode/Studio for dev |
| Styling | **NativeWind v4** | Tailwind classes 1:1 with web |
| Navigation | **React Navigation v7** (native-stack + bottom-tabs) | Mature, matches mobile patterns |
| Data | `@tanstack/react-query` (same version) + same Supabase client | Reuse hooks |
| Storage | `@react-native-async-storage/async-storage` | Replaces localStorage in supabase auth + checklist persistence |
| Forms | `react-hook-form` + `zod` (same as web) | Direct port |
| Icons | `lucide-react-native` | Same icon set as web |
| Animations | `react-native-reanimated` v3 + `moti` | Replaces framer-motion |
| Bottom sheets | `@gorhom/bottom-sheet` | Replaces shadcn Sheet/Drawer |
| Haptics | `expo-haptics` | Maps to existing `haptics.ts` API |
| Geolocation (check-in) | `expo-location` | Replaces browser geolocation |
| Push notifications | `expo-notifications` | Bridges to existing `web_push_*` infra later |
| Maps/distance | Plain Haversine in `lib/` | No map dep needed |
| Date | `date-fns` | Same as web |
| SVG | `react-native-svg` + transformer | For AlignLogo, charts |
| Charts | `victory-native` | Manager analytics |

## Design system migration

- `tailwind.config.js` mirrors web tokens but converts `hsl(var(--x))` → static HSL strings (NativeWind v4 supports CSS vars but RN runtime needs concrete values per theme).
- Two token sets exported from `theme/tokens.ts`: `lightTokens`, `darkTokens`. ThemeProvider injects via NativeWind's `vars()`.
- Custom utilities `.lift`, `.press`, `.sheen`, `.display-tight` reimplemented as small RN components (`<Pressable>` wrappers with Reanimated) since CSS pseudo-classes/keyframes don't exist in RN.
- Fonts (Fraunces display, Inter body) loaded via `expo-font`.

## Component mapping

| Web (shadcn/Radix) | React Native equivalent |
|---|---|
| `Button` | Custom `Pressable` with CVA-style variants |
| `Card` | `View` with rounded-2xl + shadow |
| `Input`, `Textarea` | `TextInput` |
| `Sheet`, `Drawer` | `@gorhom/bottom-sheet` modal |
| `Dialog`, `AlertDialog` | RN `Modal` with backdrop |
| `Toast`/Sonner | `sonner-native` |
| `Tabs` | Custom segmented control |
| `Select`, `DropdownMenu` | `@gorhom/bottom-sheet` action sheet |
| `Tooltip` | omit on mobile (long-press hint instead) |
| `framer-motion` | `moti` |

## What stays untouched

- Everything under `src/` (web app)
- `capacitor.config.ts` if/when added — not modified
- `vite.config.ts`, PWA service worker
- Supabase schema, edge functions, RLS

## Hooks portability

All hooks under `src/hooks/` are pure data hooks calling Supabase + React Query. They get **copied verbatim** into `mobile/src/hooks/` with two adjustments:
1. Any `window.`/`localStorage.`/`document.` usage replaced with RN APIs.
2. `useGeolocation` rewritten using `expo-location`.

## Out of scope for first cut

- Building/signing iOS+Android binaries (user runs `npx expo start` themselves)
- Apple/Google push provisioning
- Landing page (web-only)
- Capacitor app — left as-is per request

## Deliverables

- Fully scaffolded `mobile/` Expo project that runs with `cd mobile && npm install && npx expo start`
- All screens listed above implemented with shared visual language
- README in `mobile/README.md` with run instructions
- All Supabase data flows working against the same backend as the web app

## Effort note

This is a large port (~40+ screens/components). I will land it in one pass but the resulting `mobile/` directory will contain many new files. The web app is unaffected.
