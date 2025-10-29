import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootNavigator from "./src/navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

const qc = new QueryClient();
export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={qc}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
