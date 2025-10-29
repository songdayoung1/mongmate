import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PhoneNumberScreen from "../screens/auth/PhoneNumberScreen";
import VerifyCodeScreen from "../screens/auth/VerifyCodeScreen";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";

export type AuthStackParamList = {
  PhoneNumber: undefined;
  VerifyCode: { phone?: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0ACF83", // 초록 베이스
    text: "#ffffff",
    primary: "#ffffff",
    card: "#0ACF83",
    border: "transparent",
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <KeyboardDismissWrapper>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
        </Stack.Navigator>
      </KeyboardDismissWrapper>
    </NavigationContainer>
  );
}
