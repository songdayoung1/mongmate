import React from "react";
import { TouchableOpacity, Animated, TouchableOpacityProps, StyleProp, ViewStyle } from "react-native";

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
}: TouchableOpacityProps & { scaleValue?: number, duration?: number }) {
    const animatedScale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = (e: any) => {
        Animated.spring(animatedScale, {
            toValue: scaleValue,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
        onPressIn && onPressIn(e);
    };

    const handlePressOut = (e: any) => {
        Animated.spring(animatedScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
        onPressOut && onPressOut(e);
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
