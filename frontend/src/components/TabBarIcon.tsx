import React from "react";
import { View } from "react-native";
import {
  LucideIcon,
  Home,
  PawPrint,
  MessageCircle,
  User,
} from "lucide-react-native";

type Props = {
  name: "home" | "paw" | "message-circle" | "user";
  color?: string;
  size?: number;
};

const icons: Record<string, LucideIcon> = {
  home: Home,
  paw: PawPrint,
  "message-circle": MessageCircle,
  user: User,
};

export default function TabBarIcon({ name, color = "#888", size = 24 }: Props) {
  const Icon = icons[name];
  return (
    <View>
      <Icon color={color} size={size} />
    </View>
  );
}
