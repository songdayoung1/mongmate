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
    phone: string;
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
  // const isLoggedIn = useAuthStore((s) => !!s.user);

  return (
    <NavigationContainer theme={theme}>
      <KeyboardDismissWrapper>
        <Stack.Navigator
          id="RootStack"
          initialRouteName="AuthStart" // 임시
          // {isLoggedIn ? "Main" : "AuthStart"} // 로그인 여부에 따라 분기
          screenOptions={{
            headerShown: false,
            headerTitleAlign: "center",
          }}
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
