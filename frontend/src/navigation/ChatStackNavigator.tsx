import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatListScreen from "../screens/chat/ChatListScreen";
import ChatRoomScreen from "../screens/chat/ChatRoomScreen";

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { roomId: string; title?: string };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export default function ChatStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
}
