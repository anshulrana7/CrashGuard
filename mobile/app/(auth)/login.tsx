import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useState, useContext, useRef } from "react";
import { router } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import FloatingInput from "../../components/FloatingInput";
import GradientButton from "../../components/GradientButton";
import ParticlesBackground from "../../components/ParticlesBackground";
import { Ionicons } from "@expo/vector-icons";
import axios, { AxiosError } from "axios";

const API = "http://10.121.183.124:4000";

export default function Login() {

  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim,{toValue:10,duration:60,useNativeDriver:true}),
      Animated.timing(shakeAnim,{toValue:-10,duration:60,useNativeDriver:true}),
      Animated.timing(shakeAnim,{toValue:6,duration:60,useNativeDriver:true}),
      Animated.timing(shakeAnim,{toValue:0,duration:60,useNativeDriver:true}),
    ]).start();
  };

  const handleLogin = async () => {

    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      shake();
      return;
    }

    try {

      setLoading(true);

      const res = await axios.post(`${API}/v1/auth/login`,{
        email,
        password
      });

      // save token in context
      login(res.data.token);

      // go to app
      router.replace("/(tabs)");

    } catch (err) {

      const error = err as AxiosError<any>;

      const message =
        error?.response?.data?.error || "Login failed";

      setError(message);
      shake();

    } finally {

      setLoading(false);

    }

  };

  return (
    <View style={styles.container}>

      <ParticlesBackground />

      <Animated.View
        style={[
          styles.card,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >

        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>CrashGuard</Text>
        <Text style={styles.subtitle}>Stay Safe Anywhere</Text>

        {/* EMAIL */}
        <FloatingInput
          label="Email"
          value={email}
          onChangeText={(text: string) => {
            setEmail(text);
            setError("");
          }}
        />

        {/* PASSWORD */}
        <FloatingInput
          label="Password"
          value={password}
          onChangeText={(text: string) => {
            setPassword(text);
            setError("");
          }}
          secureTextEntry={secure}
          rightIcon={
            <Pressable
              style={styles.eye}
              onPress={() => setSecure(!secure)}
            >
              <Ionicons
                name={secure ? "eye-off" : "eye"}
                size={20}
                color="#aaa"
              />
            </Pressable>
          }
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <Pressable
          style={styles.forgot}
          onPress={() => router.push("/(auth)/forgot")}
        >
          <Text style={styles.forgotText}>
            Forgot Password?
          </Text>
        </Pressable>

        {/* LOGIN BUTTON */}
        <View style={styles.buttonWrapper}>

          {loading ? (

            <ActivityIndicator color="#fff" />

          ) : (

            <GradientButton
              title="Login"
              onPress={handleLogin}
            />

          )}

        </View>

        {/* GOOGLE LOGIN */}
        <Pressable style={styles.googleBtn}>
          <Ionicons name="logo-google" size={22} color="#DB4437" />
          <Text style={styles.googleText}>
            Login with Google
          </Text>
        </Pressable>

        {/* SIGNUP */}
        <View style={styles.signupRow}>

          <Text style={{ color: "#aaa" }}>
            Don't have an account?
          </Text>

          <Pressable
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.signupText}>
              {" "}Sign Up
            </Text>
          </Pressable>

        </View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#141E30",
    justifyContent:"center",
    padding:25,
  },

  card:{
    backgroundColor:"rgba(255,255,255,0.08)",
    padding:25,
    borderRadius:20,
  },

  logo:{
    width:70,
    height:70,
    alignSelf:"center",
    marginBottom:10,
  },

  title:{
    fontSize:24,
    fontWeight:"bold",
    color:"#fff",
    textAlign:"center",
  },

  subtitle:{
    textAlign:"center",
    color:"#aaa",
    marginBottom:30,
  },

  eye:{
    position:"absolute",
    right:10,
    top:17,
  },

  errorText:{
    color:"#ff4d4d",
    textAlign:"center",
    marginBottom:10,
  },

  forgot:{
    alignSelf:"flex-end",
    marginBottom:15,
  },

  forgotText:{
    color:"#00F5FF",
    fontSize:13,
  },

  buttonWrapper:{
    marginBottom:10,
  },

  googleBtn:{
    flexDirection:"row",
    backgroundColor:"#fff",
    padding:14,
    borderRadius:12,
    justifyContent:"center",
    marginTop:15,
  },

  googleText:{
    marginLeft:10,
    fontSize:15,
    fontWeight:"600",
  },

  signupRow:{
    flexDirection:"row",
    justifyContent:"center",
    marginTop:20,
  },

  signupText:{
    color:"#00F5FF",
    fontWeight:"600",
  },

});