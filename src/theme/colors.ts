import { useColorScheme } from 'react-native';

const light = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  text: '#2B2420',
  muted: '#6F655D',
  border: '#E4DDD3',
  accent: '#9C4A2E',
  accentText: '#FFFFFF',
};

const dark: typeof light = {
  background: '#171412',
  surface: '#221E1B',
  text: '#F3EDE6',
  muted: '#A99E94',
  border: '#3A332E',
  accent: '#E08A64',
  accentText: '#171412',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
