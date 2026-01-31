import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";
import MyProfileScreen from "../screens/my/MyProfileScreen";
import CreatePostScreen from "../screens/home/CreatePostScreen";
import AuthStartScreen from "../screens/auth/AuthStartScreen";
import SignupInfoScreen from "../screens/auth/SignupInfoScreen";
import AuthOtpScreen from "../screens/auth/AuthOtpScreen";
import { useAuthStore } from "../store/auth";

export type RootStackParamList = {
  Main: undefined;
  MyProfile: undefined;
  CreatePost: undefined;

  AuthStart: undefined;
  SignupInfo: undefined;
  AuthOtp: {
    mode: "signup" | "login";
    phoneNumber: string;
    carrier?: string;
    name?: string;
    birth?: string;
    idDigit?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#ffffff",
    text: "#111111",
    primary: "#0ACF83",
    card: "#ffffff",
    border: "#e5e5e5",
  },
};

export default function RootNavigator() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthed = useAuthStore((s) => s.isAuthed);

  if (!hydrated) return null;

  return (
    <NavigationContainer theme={theme}>
      <KeyboardDismissWrapper>
        {/* ✅ key로 스택 자체를 리셋 */}
        <Stack.Navigator
          key={isAuthed ? "authed" : "guest"}
          screenOptions={{ headerShown: false, headerTitleAlign: "center" }}
        >
          {isAuthed ? (
            <>
              <Stack.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="MyProfile" component={MyProfileScreen} />
              <Stack.Screen name="CreatePost" component={CreatePostScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="AuthStart" component={AuthStartScreen} />
              <Stack.Screen name="SignupInfo" component={SignupInfoScreen} />
              <Stack.Screen name="AuthOtp" component={AuthOtpScreen} />
            </>
          )}
        </Stack.Navigator>
      </KeyboardDismissWrapper>
    </NavigationContainer>
  );
}
