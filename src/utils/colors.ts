export const COLORS = {
  bgPink: '#FFF5F7',
  bgLavender: '#F8F0FF',
  accentPink: '#F9A8D4',
  accentLavender: '#C4B5FD',
  accentGold: '#FDE68A',
  text: '#5B2C6F',
  textLight: '#8B5CF6',
  white: '#FFFFFF',
  heartRed: '#F472B6',
} as const;

export const PASTEL_COLORS = [
  '#F9A8D4', // розовый
  '#C4B5FD', // сиреневый
  '#A7F3D0', // мятный
  '#FDBA74', // персиковый
  '#93C5FD', // голубой
  '#FDE68A', // золотой
  '#FCA5A5', // коралловый
  '#D8B4FE', // лавандовый
];

export const CONFETTI_COLORS = [
  ...PASTEL_COLORS,
  '#FDE68A', // доп. золотой
  '#F5D0A9', // доп. золотой тёплый
];

export function randomPastel(): string {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
}

export function randomConfettiColor(): string {
  return CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
}
