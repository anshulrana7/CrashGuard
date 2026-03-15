import { View, StyleSheet, Pressable, Linking, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useState } from "react";
import axios from "axios";
import * as Location from "expo-location";

import { ThemedText } from "@/components/themed-text";
import { useLocalSearchParams } from "expo-router";

const API = "http://10.121.183.124:4000";

export default function HelperMap() {

  // ---------------- PARAMS FROM NOTIFICATION ----------------
  const params = useLocalSearchParams();

  const eventId = String(params.eventId || "e_test123");
  const lat = Number(params.lat || 30.7046);
  const lng = Number(params.lng || 76.7179);

  // ---------------- STATES ----------------
  const [eventLocation,setEventLocation] = useState({
    lat: lat,
    lng: lng
  });

  const [myLocation,setMyLocation] = useState<any>(null);
  const [distance,setDistance] = useState<number>(0);

  // ---------------- LOAD EVENT LOCATION ----------------
  async function loadEvent(){

    try{

      const r = await axios.get(`${API}/v1/events/${eventId}`);
      const ev = r.data.event;

      if(ev?.location){

        const loc={
          lat:ev.location.lat,
          lng:ev.location.lng
        };

        setEventLocation(loc);

        if(myLocation){
          calculateDistance(myLocation,loc);
        }

      }

    }catch{
      console.log("Event load failed");
    }

  }

  // ---------------- GET USER LOCATION ----------------
  async function loadMyLocation(){

    try{

      const perm = await Location.requestForegroundPermissionsAsync();

      if(perm.status !== "granted"){
        Alert.alert("Location permission required");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy:Location.Accuracy.Balanced
      });

      const coords={
        lat:loc.coords.latitude,
        lng:loc.coords.longitude
      };

      setMyLocation(coords);

      calculateDistance(coords,eventLocation);

    }catch{
      console.log("Location error");
    }

  }

  // ---------------- DISTANCE CALCULATION ----------------
  function calculateDistance(a:any,b:any){

    const R=6371;

    const dLat=(b.lat-a.lat)*Math.PI/180;
    const dLng=(b.lng-a.lng)*Math.PI/180;

    const x=
      Math.sin(dLat/2)**2+
      Math.cos(a.lat*Math.PI/180)*
      Math.cos(b.lat*Math.PI/180)*
      Math.sin(dLng/2)**2;

    const d=2*R*Math.asin(Math.sqrt(x));

    setDistance(Number((d*1000).toFixed(0)));

  }

  // ---------------- INITIAL LOAD ----------------
  useEffect(()=>{

    loadEvent();
    loadMyLocation();

  },[]);

  // ---------------- NAVIGATE ----------------
  function navigate(){

    const url=`https://www.google.com/maps?q=${eventLocation.lat},${eventLocation.lng}`;
    Linking.openURL(url);

  }

  // ---------------- RESCUE ----------------
  async function rescue(){

    try{

      await axios.post(`${API}/v1/events/${eventId}/rescue`,{
        ambulance_id:"AMB-102"
      });

      Alert.alert("Rescue confirmed");

    }catch{

      Alert.alert("Rescue failed");

    }

  }

  return(

    <View style={styles.container}>

      <MapView
        style={{flex:1}}
        region={{
          latitude:eventLocation.lat,
          longitude:eventLocation.lng,
          latitudeDelta:0.01,
          longitudeDelta:0.01
        }}
      >

        <Marker
          coordinate={{
            latitude:eventLocation.lat,
            longitude:eventLocation.lng
          }}
        />

      </MapView>

      <View style={styles.panel}>

        <ThemedText style={styles.distance}>
          Distance: {distance} meters
        </ThemedText>

        <Pressable style={styles.navBtn} onPress={navigate}>
          <ThemedText style={styles.btnText}>
            Navigate
          </ThemedText>
        </Pressable>

        <Pressable style={styles.rescueBtn} onPress={rescue}>
          <ThemedText style={styles.btnText}>
            Rescue Victim
          </ThemedText>
        </Pressable>

      </View>

    </View>

  );

}

const styles=StyleSheet.create({

  container:{
    flex:1
  },

  panel:{
    position:"absolute",
    bottom:20,
    left:20,
    right:20,
    backgroundColor:"#fff",
    padding:20,
    borderRadius:16,
    shadowColor:"#000",
    shadowOpacity:0.2,
    shadowRadius:10,
    elevation:5
  },

  distance:{
    fontSize:16,
    fontWeight:"bold",
    marginBottom:10
  },

  navBtn:{
    backgroundColor:"#2563eb",
    padding:14,
    borderRadius:10,
    marginBottom:10
  },

  rescueBtn:{
    backgroundColor:"#ef4444",
    padding:14,
    borderRadius:10
  },

  btnText:{
    color:"#fff",
    textAlign:"center",
    fontWeight:"bold"
  }

});