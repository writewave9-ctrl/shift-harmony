/**
 * Haptic feedback utility for mobile devices
 */
export const haptics = {
  light: () => {
    if (navigator.vibrate) navigator.vibrate(5);
  },
  medium: () => {
    if (navigator.vibrate) navigator.vibrate(10);
  },
  heavy: () => {
    if (navigator.vibrate) navigator.vibrate(20);
  },
  success: () => {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  },
  error: () => {
    if (navigator.vibrate) navigator.vibrate([20, 100, 20]);
  },
  selection: () => {
    if (navigator.vibrate) navigator.vibrate(3);
  },
};
