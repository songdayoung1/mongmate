import React from "react";
import {
  TouchableOpacity,
  Animated,
  TouchableOpacityProps,
  Platform,
} from "react-native";

const USE_NATIVE_DRIVER = Platform.OS !== "web";

export default function AnimatedButton({
  onPress,
  onPressIn,
  onPressOut,
  style,
  activeOpacity = 0.9,
  children,
  scaleValue = 0.96,
  duration = 100,
  ...props
}: TouchableOpacityProps & { scaleValue?: number; duration?: number }) {
  const animatedScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(animatedScale, {
      toValue: scaleValue,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 20,
      bounciness: 4,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(animatedScale, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 20,
      bounciness: 4,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Animated.View style={[{ transform: [{ scale: animatedScale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={activeOpacity}
        style={style}
        {...props}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
