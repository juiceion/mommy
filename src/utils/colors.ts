export const COLORS = {
  bgPrimary: '#FEFCE8',
  bgSecondary: '#F0FDF4',
  accentPink: '#EC4899',
  accentGreen: '#22C55E',
  accentGold: '#FACC15',
  accentViolet: '#A855F7',
  accentCoral: '#FB7185',
  text: '#1E3A2F',
  textLight: '#7C3AED',
  white: '#FFFFFF',
  heartRed: '#F43F5E',
} as const;

export const PASTEL_COLORS = [
  '#EC4899', // яркая сакура
  '#A855F7', // фиолетовый
  '#22C55E', // весенняя зелень
  '#FACC15', // солнечный жёлтый
  '#FB7185', // тёплый коралл
  '#38BDF8', // небесно-голубой
  '#F97316', // мандариновый
  '#34D399', // изумрудный мятный
];

export const CONFETTI_COLORS = [
  ...PASTEL_COLORS,
  '#FDE047', // доп. жёлтый
  '#F5D0A9', // доп. золотой тёплый
];

export function randomPastel(): string {
  return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
}

export function randomConfettiColor(): string {
  return CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
}
