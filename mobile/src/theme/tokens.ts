import { vars } from 'nativewind';

// HSL -> RGB once at design-time so NativeWind can apply alpha at runtime.
function hslToRgb(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return `${f(0)} ${f(8)} ${f(4)}`;
}

const light = {
  background: hslToRgb(40, 20, 98),
  foreground: hslToRgb(220, 20, 14),
  card: hslToRgb(0, 0, 100),
  'card-foreground': hslToRgb(220, 20, 14),
  primary: hslToRgb(168, 42, 34),
  'primary-foreground': hslToRgb(0, 0, 100),
  secondary: hslToRgb(40, 15, 94),
  'secondary-foreground': hslToRgb(220, 15, 30),
  muted: hslToRgb(40, 12, 92),
  'muted-foreground': hslToRgb(220, 10, 50),
  accent: hslToRgb(168, 30, 94),
  'accent-foreground': hslToRgb(168, 45, 24),
  destructive: hslToRgb(12, 60, 55),
  'destructive-foreground': hslToRgb(0, 0, 100),
  success: hslToRgb(152, 45, 45),
  'success-foreground': hslToRgb(0, 0, 100),
  'success-muted': hslToRgb(152, 40, 94),
  warning: hslToRgb(38, 85, 55),
  'warning-foreground': hslToRgb(38, 90, 20),
  'warning-muted': hslToRgb(38, 70, 94),
  info: hslToRgb(210, 60, 55),
  'info-foreground': hslToRgb(0, 0, 100),
  'info-muted': hslToRgb(210, 50, 95),
  border: hslToRgb(40, 15, 88),
  input: hslToRgb(40, 15, 88),
  ring: hslToRgb(168, 42, 34),
};

const dark = {
  background: hslToRgb(200, 18, 7),
  foreground: hslToRgb(40, 18, 96),
  card: hslToRgb(200, 16, 11),
  'card-foreground': hslToRgb(40, 18, 96),
  primary: hslToRgb(168, 55, 62),
  'primary-foreground': hslToRgb(200, 30, 8),
  secondary: hslToRgb(200, 14, 15),
  'secondary-foreground': hslToRgb(40, 15, 90),
  muted: hslToRgb(200, 14, 14),
  'muted-foreground': hslToRgb(200, 8, 70),
  accent: hslToRgb(168, 30, 18),
  'accent-foreground': hslToRgb(168, 60, 78),
  destructive: hslToRgb(8, 75, 62),
  'destructive-foreground': hslToRgb(8, 60, 10),
  success: hslToRgb(152, 55, 62),
  'success-foreground': hslToRgb(152, 60, 10),
  'success-muted': hslToRgb(152, 35, 14),
  warning: hslToRgb(38, 90, 62),
  'warning-foreground': hslToRgb(38, 90, 12),
  'warning-muted': hslToRgb(38, 45, 14),
  info: hslToRgb(210, 75, 68),
  'info-foreground': hslToRgb(210, 60, 10),
  'info-muted': hslToRgb(210, 35, 15),
  border: hslToRgb(200, 12, 18),
  input: hslToRgb(200, 12, 18),
  ring: hslToRgb(168, 60, 65),
};

const toVars = (t: typeof light) =>
  Object.fromEntries(Object.entries(t).map(([k, v]) => [`--${k}`, v]));

export const themes = {
  light: vars(toVars(light)),
  dark: vars(toVars(dark)),
};
