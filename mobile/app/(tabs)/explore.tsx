import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useEffect } from "react";
import axios from "axios";
import * as Location from "expo-location";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

const API = "http://10.121.183.124:4000";

// ⚠️ test event id (later notification se ayega)
const eventId = "e_test123";

export default function ExploreScreen() {

  // ---------------- RESCUE ----------------
  const rescuePerson = async () => {

    try {

      await axios.post(`${API}/v1/events/${eventId}/rescue`, {
        ambulance_id: "AMB-102"
      });

      Alert.alert("Rescue Confirmed", "Victim rescued successfully");

    } catch {

      Alert.alert("Error", "Rescue failed");

    }

  };

  // ---------------- TRANSPORT ----------------
  const startTransport = async () => {

    try {

      await axios.post(`${API}/v1/events/${eventId}/transport`);

      Alert.alert("Transport Started", "Ambulance heading to hospital");

    } catch {

      Alert.alert("Transport error");

    }

  };

  // ---------------- LIVE LOCATION SENDER ----------------
  async function sendLiveLocation() {

    try {

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      await axios.post(`${API}/v1/events/${eventId}/location`, {

        lat: loc.coords.latitude,
        lng: loc.coords.longitude

      });

    } catch (err) {

      console.log("Location send error");

    }

  }

  // send location every 3 seconds
  useEffect(() => {

    const interval = setInterval(() => {

      sendLiveLocation();

    }, 3000);

    return () => clearInterval(interval);

  }, []);

  return (

    <ThemedView style={styles.container}>

      <ThemedText style={styles.title}>
        🚑 Ambulance / Helper Panel
      </ThemedText>

      <Pressable style={styles.rescueBtn} onPress={rescuePerson}>
        <ThemedText style={styles.btnText}>
          Rescue Victim
        </ThemedText>
      </Pressable>

      <Pressable style={styles.transportBtn} onPress={startTransport}>
        <ThemedText style={styles.btnText}>
          Start Transport
        </ThemedText>
      </Pressable>

    </ThemedView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 30
  },

  rescueBtn: {
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 12,
    width: "80%",
    marginBottom: 15
  },

  transportBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    width: "80%"
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16
  }

});