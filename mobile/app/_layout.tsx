import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthContext, AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootNavigator() {

  const { userToken, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown:false }}>

      <Stack.Screen
        name="(auth)"
        options={{ headerShown:false }}
      />

      <Stack.Screen
        name="(tabs)"
        options={{ headerShown:false }}
      />

    </Stack>
  );
}