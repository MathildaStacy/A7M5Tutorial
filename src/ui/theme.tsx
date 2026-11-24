import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
export const color = {
  bg: '#0D0F12',
  card: '#16191E',
  raised: '#1D2127',
  line: '#2A2F37',
  ink: '#EDEFF3',
  sub: '#A2A9B5',
  muted: '#828A98',
  accent: '#F28B26',
  soft: '#36271B',
  good: '#3DC57B',
  bad: '#F2584D',
};
export const font = {
  body: 'NotoSansSC',
  number: 'SairaSemiCondensed-SemiBold',
  mono: 'IBMPlexMono-Regular',
};
export function Txt({style, ...p}: TextProps) {
  return <Text {...p} style={[styles.body, style]} />;
}
export function Button({
  children,
  onPress,
  active = false,
  primary = false,
  disabled = false,
  label,
}: {
  children: string;
  onPress: () => void;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? children}
      accessibilityState={{selected: active, disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        active && styles.active,
        primary && styles.primary,
        {opacity: disabled ? 0.45 : pressed ? 0.72 : 1},
      ]}
    >
      <Txt
        style={[styles.buttonText, active && {color: color.accent}, primary && {color: color.bg}]}
      >
        {children}
      </Txt>
    </Pressable>
  );
}
export function Card({children, style}: {children: React.ReactNode; style?: StyleProp<ViewStyle>}) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: color.bg},
  pad: {padding: 18, gap: 15, paddingBottom: 32},
  title: {fontSize: 27, lineHeight: 38, fontWeight: '700', color: color.ink},
  h2: {fontSize: 18, lineHeight: 28, fontWeight: '600', color: color.ink},
  body: {fontFamily: font.body, fontSize: 14, lineHeight: 22, color: color.ink},
  sub: {fontSize: 13, color: color.sub, lineHeight: 21},
  eyebrow: {fontFamily: font.mono, fontSize: 11, lineHeight: 18, color: color.muted},
  card: {
    backgroundColor: color.card,
    borderColor: color.line,
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    gap: 9,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 7},
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.raised,
    paddingVertical: 7,
    paddingHorizontal: 12,
    minHeight: 38,
  },
  active: {borderColor: color.accent, backgroundColor: color.soft},
  primary: {borderColor: color.accent, backgroundColor: color.accent},
  buttonText: {fontSize: 13, lineHeight: 21},
  input: {
    fontFamily: font.body,
    borderColor: color.line,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: color.ink,
    backgroundColor: color.bg,
  },
  num: {fontFamily: font.number, color: color.ink, fontSize: 20, lineHeight: 26},
  rule: {height: 1, backgroundColor: color.line},
  spread: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
});
