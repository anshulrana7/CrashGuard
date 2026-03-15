import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Notifications from "expo-notifications";

export const AuthContext = createContext<any>(null);

const API = "http://10.121.183.124:4000";

export const AuthProvider = ({ children }: any) => {

  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ⭐ PROFILE LOAD FUNCTION
  const loadProfile = async (token: string) => {

    try {

      const res = await axios.get(`${API}/v1/auth/profile`, {
        headers: {
          Authorization: token
        }
      });

      setUser(res.data);

    } catch (err) {

      console.log("Profile load failed");

    }

  };

  // ⭐ APP START TOKEN LOAD
  useEffect(() => {

    const loadToken = async () => {

      try {

        const token = await AsyncStorage.getItem("token");

        if (token) {

          setUserToken(token);

          // axios global header
          axios.defaults.headers.common["Authorization"] = token;

          await loadProfile(token);

        }

      } catch (err) {

        console.log("Token load error");

      } finally {

        setLoading(false);

      }

    };

    loadToken();

  }, []);

  // ⭐ LOGIN FUNCTION
  const login = async (token: string) => {

  try {

    await AsyncStorage.setItem("token", token);

    setUserToken(token);

    axios.defaults.headers.common["Authorization"] = token;

    await loadProfile(token);

    // ⭐ SAVE PUSH TOKEN AFTER LOGIN
    try {

      const pushToken = (await Notifications.getExpoPushTokenAsync()).data;

      await axios.put(
        `${API}/v1/auth/push-token`,
        { push_token: pushToken },
        {
          headers: { Authorization: token }
        }
      );

      console.log("Push token saved:", pushToken);

    } catch (err) {

      console.log("Push token save failed");

    }

  } catch (err) {

    console.log("Login error");

  }

  };

  

  // ⭐ LOGOUT FUNCTION
  const logout = async () => {

    try {

      await AsyncStorage.removeItem("token");

      setUserToken(null);
      setUser(null);

      delete axios.defaults.headers.common["Authorization"];

    } catch (err) {

      console.log("Logout error");

    }

  };

  return (

    <AuthContext.Provider
      value={{
        userToken,
        login,
        logout,
        user,
        setUser,
        loading,
        loadProfile   // ⭐ profile refresh function
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};