# Align Mobile (React Native + Expo + NativeWind)

A 1:1 port of the Align webapp into a true native iOS + Android app, sharing
the same Lovable Cloud (Supabase) backend as the web app.

The web app under `/src` and the existing Capacitor/PWA setup are **untouched**.

## Stack

- **Expo SDK 51** (managed workflow)
- **React Native 0.74** + **NativeWind v4** for styling parity with the Tailwind web design system
- **React Navigation v7** (native-stack + bottom-tabs)
- **@tanstack/react-query** for data
- **@supabase/supabase-js** with `AsyncStorage` persistence
- **expo-location** for proximity check-in, **expo-haptics** for tactile feedback
- **lucide-react-native** icons, **Fraunces** + **Inter** fonts via `expo-font`
- **sonner-native** toasts, **@gorhom/bottom-sheet** for sheets

## Run it locally

```bash
cd mobile
npm install
npx expo start
```

Then press `i` (iOS Simulator) or `a` (Android Emulator), or scan the QR code
with the **Expo Go** app on your phone.

For a development build (recommended once you add native modules beyond Expo's
prebuilt list):

```bash
npx expo prebuild
npx expo run:ios     # requires macOS + Xcode
npx expo run:android # requires Android Studio
```

## What's included

**Worker**
- Home (today's shift, native check-in with geolocation, upcoming shifts)
- Shifts (full upcoming list)
- Team directory
- Notifications
- Profile (with sign-out)

**Manager**
- Dashboard (today's coverage, vacant gaps, pending counts)
- Shifts (grouped by date)
- Requests (swaps, pickups, call-offs with approve/decline)
- Team
- More (profile + sign-out hub)

**Shared**
- Auth (sign in / sign up with role selection)
- Light + dark themes (system / manual via header toggle)
- Same Supabase project as the web app — sign in with the same credentials

## Project layout

```
mobile/
  app.json              Expo config (icon perms, supabase URL/anon)
  babel.config.js       NativeWind preset + reanimated plugin
  metro.config.js       NativeWind metro transformer
  tailwind.config.js    Mirrors web design tokens
  global.css            NativeWind v4 entry
  src/
    App.tsx             Providers + font loader
    theme/              tokens.ts (HSL→RGB), ThemeProvider
    navigation/         RootNavigator, WorkerTabs, ManagerTabs
    contexts/AuthContext.tsx
    integrations/supabase/client.ts
    hooks/              useShifts, useNotifications, useGeolocation
    lib/                queryClient, formatTime, haptics, utils
    components/         AlignLogo, AppHeader, ThemeToggle, ui/*
    screens/
      auth/AuthScreen.tsx
      worker/           Home, Shifts, TeamDirectory, Notifications, Profile
      manager/          Dashboard, Shifts, ShiftRequests, Team, More
```

## Design system parity

All Tailwind tokens from the web app are mirrored in `tailwind.config.js`,
backed by CSS variables that switch between `light` and `dark` palettes via
NativeWind's `vars()` helper in `theme/tokens.ts`. The same semantic classes
(`bg-card`, `text-foreground`, `bg-primary`, `text-muted-foreground`, etc.)
work identically here. Fonts (Fraunces display + Inter body) load through
`@expo-google-fonts/*`.

## Backend

Points at the same Lovable Cloud project as the web app. No schema changes
required. Auth tokens are persisted to `AsyncStorage`; sessions survive app
restarts and refresh automatically.

## Not included (intentionally)

- Public landing page — the mobile app opens straight into auth
- Web-only Capacitor/PWA wrapper (left untouched in the root project)
- iOS/Android native build artifacts (run `npx expo prebuild` to generate them)
