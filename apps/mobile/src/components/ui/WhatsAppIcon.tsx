import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { StyleProp, ViewStyle } from 'react-native';
import { Tokens } from '@/constants/theme';

export interface WhatsAppIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function WhatsAppIcon({
  size = 24,
  color = Tokens.colors.whatsapp,
  style,
  testID = 'whatsapp-icon',
}: WhatsAppIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={style}
      testID={testID}
      accessibilityRole="image"
      accessibilityLabel="WhatsApp"
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.56 20.15 9.11 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.6L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.05 20.15ZM16.57 14.34C16.32 14.21 15.1 13.61 14.87 13.53C14.64 13.44 14.48 13.4 14.31 13.65C14.15 13.9 13.68 14.45 13.54 14.61C13.4 14.78 13.26 14.8 13.01 14.67C12.76 14.55 11.96 14.28 11.01 13.44C10.27 12.78 9.77 11.97 9.63 11.72C9.49 11.47 9.61 11.34 9.74 11.21C9.85 11.1 9.99 10.92 10.11 10.78C10.24 10.64 10.28 10.53 10.36 10.37C10.44 10.2 10.4 10.06 10.34 9.93C10.28 9.81 9.78 8.58 9.58 8.08C9.38 7.59 9.17 7.66 9.02 7.65C8.88 7.64 8.71 7.64 8.55 7.64C8.38 7.64 8.11 7.7 7.89 7.95C7.66 8.19 7.02 8.79 7.02 10.01C7.02 11.23 7.91 12.41 8.03 12.57C8.16 12.74 9.77 15.22 12.24 16.29C12.83 16.54 13.28 16.69 13.64 16.81C14.24 17 14.78 16.97 15.21 16.91C15.69 16.84 16.68 16.31 16.89 15.73C17.09 15.15 17.09 14.65 17.03 14.55C16.97 14.45 16.82 14.46 16.57 14.34Z"
      />
    </Svg>
  );
}
