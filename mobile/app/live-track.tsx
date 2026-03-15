import { View, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://10.121.183.124:4000";
const eventId = "e_test123";

export default function LiveTrack(){

  const [location,setLocation] = useState({
    lat:30.7046,
    lng:76.7179
  });

  useEffect(()=>{

    const interval = setInterval(async()=>{

      const r = await axios.get(`${API}/v1/events/${eventId}`);
      const ev = r.data.event;

      if(ev.location){

        setLocation({
          lat:ev.location.lat,
          lng:ev.location.lng
        });

      }

    },3000);

    return ()=> clearInterval(interval);

  },[]);

  return(

    <View style={styles.container}>

      <MapView
        style={{flex:1}}
        region={{
          latitude:location.lat,
          longitude:location.lng,
          latitudeDelta:0.01,
          longitudeDelta:0.01
        }}
      >

        <Marker coordinate={{
          latitude:location.lat,
          longitude:location.lng
        }}/>

      </MapView>

    </View>

  );

}

const styles = StyleSheet.create({
  container:{ flex:1 }
});