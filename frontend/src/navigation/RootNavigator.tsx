import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import PhoneNumberScreen from "../screens/auth/PhoneNumberScreen";
import KeyboardDismissWrapper from "../components/KeyboardDismissWrapper";
import MyProfileScreen from "../screens/my/MyProfileScreen";

export type RootStackParamList = {
  Main: undefined;
  PhoneNumber: undefined;
  MyProfile: undefined;
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
  return (
    <NavigationContainer theme={theme}>
      <KeyboardDismissWrapper>
        <Stack.Navigator
          screenOptions={{
            headerShown: true,
            headerTitleAlign: "center",
          }}
        >
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="PhoneNumber"
            component={PhoneNumberScreen}
            options={{
              title: "로그인",
            }}
          />

          <Stack.Screen
            name="MyProfile"
            component={MyProfileScreen}
            options={{
              title: "내 프로필",
            }}
          />
        </Stack.Navigator>
      </KeyboardDismissWrapper>
    </NavigationContainer>
  );
}

{
  /* <Stack.Screen
  name="SomeScreen"
  component={SomeScreen}
  options={{ headerShown: false }}
/> */
}
