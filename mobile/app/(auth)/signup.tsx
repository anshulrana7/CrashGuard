import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useState, useContext, useEffect } from "react";
import { router } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import FloatingInput from "../../components/FloatingInput";
import GradientButton from "../../components/GradientButton";
import ParticlesBackground from "../../components/ParticlesBackground";
import { Ionicons } from "@expo/vector-icons";
import axios, { AxiosError } from "axios";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const API = "http://10.121.183.124:4000";

export default function Signup() {

  const { login } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

  const [loading, setLoading] = useState(false);

  // GOOGLE AUTH
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      "563810218372-43pgpv5ov3t4408ev1i11nepddugf42i.apps.googleusercontent.com",
  });

  // GOOGLE RESPONSE HANDLE
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      fetchGoogleUser(authentication?.accessToken);
    }
  }, [response]);

  // FETCH GOOGLE USER
  const fetchGoogleUser = async (token: string | undefined) => {

    if (!token) return;

    try {

      setLoading(true);

      const res = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const googleUser = await res.json();

      // SEND TO BACKEND
      const response = await axios.post(`${API}/v1/auth/signup`, {
        name: googleUser.name,
        email: googleUser.email,
        password: "google-auth",
      });

      const authToken = response.data?.token;

      if (authToken) {
        login(authToken);
        router.replace("/(tabs)");
      }

    } catch (err:any) {

      alert(
        err?.response?.data?.error || "Google signup failed"
      );

    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {

    if (!name || !email || !password) {
      alert("Fill all fields");
      return;
    }

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {

      setLoading(true);

      await axios.post(`${API}/v1/auth/signup`, {
        name,
        email,
        password,
      });

      alert("Signup successful. Check your email to verify account.");

      router.push("/(auth)/login");

    } catch (err) {

      const error = err as AxiosError<any>;

      const message =
        error?.response?.data?.error || "Signup failed";

      alert(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ParticlesBackground />

      <View style={styles.card}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join CrashGuard</Text>

        <FloatingInput
          label="Full Name"
          value={name}
          onChangeText={setName}
        />

        <FloatingInput
          label="Email"
          value={email}
          onChangeText={setEmail}
        />

        <FloatingInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secure1}
          rightIcon={
            <Pressable
              style={styles.eye}
              onPress={() => setSecure1(!secure1)}
            >
              <Ionicons
                name={secure1 ? "eye-off" : "eye"}
                size={20}
                color="#aaa"
              />
            </Pressable>
          }
        />

        <FloatingInput
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={secure2}
          rightIcon={
            <Pressable
              style={styles.eye}
              onPress={() => setSecure2(!secure2)}
            >
              <Ionicons
                name={secure2 ? "eye-off" : "eye"}
                size={20}
                color="#aaa"
              />
            </Pressable>
          }
        />

        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <GradientButton
            title="Create Account"
            onPress={handleSignup}
          />
        )}

        {/* GOOGLE SIGNUP */}
        <Pressable
          style={styles.googleBtn}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Ionicons name="logo-google" size={22} color="#DB4437" />
          <Text style={styles.googleText}>
            Signup with Google
          </Text>
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={{ color: "#aaa" }}>
            Already have an account?
          </Text>

          <Pressable
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.loginText}> Login</Text>
          </Pressable>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141E30",
    justifyContent: "center",
    padding: 25,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 25,
    borderRadius: 20,
  },

  logo: {
    width: 70,
    height: 70,
    alignSelf: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#aaa",
    marginBottom: 25,
  },

  eye: {
    position: "absolute",
    right: 10,
    top: 17,
  },

  googleBtn: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    marginTop: 15,
  },

  googleText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  loginText: {
    color: "#00F5FF",
    fontWeight: "600",
  },
});