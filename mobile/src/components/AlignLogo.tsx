import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop, G, Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  withWordmark?: boolean;
  bare?: boolean;
  mono?: boolean;
  color?: string;
}

export function AlignLogo({ size = 32, withWordmark, bare, mono, color = '#0f1f1c' }: Props) {
  return (
    <View className="flex-row items-center gap-2.5">
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <LinearGradient id="al-bg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#0f1f1c" />
            <Stop offset="100%" stopColor="#06110f" />
          </LinearGradient>
          <LinearGradient id="al-stroke" x1="14" y1="38" x2="34" y2="10" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#7fe3c7" />
            <Stop offset="100%" stopColor="#e8fff5" />
          </LinearGradient>
          <RadialGradient id="al-sheen" cx="0.25" cy="0.18" r="0.85">
            <Stop offset="0%" stopColor="#9be0cf" stopOpacity="0.18" />
            <Stop offset="60%" stopColor="#9be0cf" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {!bare && !mono && (
          <>
            <Rect x={0} y={0} width={48} height={48} rx={13} fill="url(#al-bg)" />
            <Rect x={0} y={0} width={48} height={48} rx={13} fill="url(#al-sheen)" />
          </>
        )}
        <G stroke={mono ? color : 'url(#al-stroke)'} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <Path d="M 13 36 L 24 11" />
          <Path d="M 24 11 L 35 36" />
          <Path d="M 17.5 27 L 30.5 27" strokeWidth={2.6} opacity={0.92} />
        </G>
        {!mono && <Circle cx={24} cy={11} r={1.6} fill="#eafff5" opacity={0.95} />}
      </Svg>
      {withWordmark && (
        <Text className="font-display text-[18px] text-foreground" style={{ letterSpacing: -0.4 }}>
          Align
        </Text>
      )}
    </View>
  );
}
