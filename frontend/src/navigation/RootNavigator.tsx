import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import PhoneNumberScreen from "../screens/auth/PhoneNumberScreen";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";
import MyProfileScreen from "../screens/my/MyProfileScreen";
import CreatePostScreen from "../screens/home/CreatePostScreen";
import AuthStartScreen from "../screens/auth/AuthStartScreen";
import SignupInfoScreen from "../screens/auth/SignupInfoScreen";
import AuthOtpScreen from "../screens/auth/AuthOtpScreen";
import { useAuthStore } from "../store/auth";

export type RootStackParamList = {
  Main: undefined;
  // PhoneNumber: undefined;
  MyProfile: undefined;
  CreatePost: undefined;

  AuthStart: undefined;
  SignupInfo: undefined;
  AuthOtp: {
    mode: "signup" | "login";
    phoneNumber: string;
    carrier?: string; // (백엔드엔 없지만 UI용)
    name?: string;
    birth?: string; // "970207"
    idDigit?: string; // "1"
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
        <Stack.Navigator
          id="RootStack"
          // initialRouteName="AuthStart" // 임시
          initialRouteName={isAuthed ? "Main" : "AuthStart"}
          screenOptions={{ headerShown: false, headerTitleAlign: "center" }}
        >
          {/* 1. 인증 플로우 */}
          <Stack.Screen name="AuthStart" component={AuthStartScreen} />
          <Stack.Screen name="SignupInfo" component={SignupInfoScreen} />

          {/* 3단계에서 구현할 OTP */}

          <Stack.Screen name="AuthOtp" component={AuthOtpScreen} />

          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />

          {/* <Stack.Screen
            name="PhoneNumber"
            component={PhoneNumberScreen}
            options={{
              headerShown: false,
            }}
          /> */}

          <Stack.Screen
            name="MyProfile"
            component={MyProfileScreen}
            options={{
              title: "내 프로필",
            }}
          />

          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </KeyboardDismissWrapper>
    </NavigationContainer>
  );
}
