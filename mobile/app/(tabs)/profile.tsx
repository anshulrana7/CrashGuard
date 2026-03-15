import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useState, useContext, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";
import AnimatedButton from "../../components/AnimatedButton";
import { router } from "expo-router";
import axios from "axios";


const API = "http://10.121.183.124:4000";

export default function Profile() {

  const { logout, userToken, user, setUser } = useContext(AuthContext);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [blood, setBlood] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergency, setEmergency] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // ================= AUTO LOAD PROFILE =================
  useEffect(() => {

    if (!user) return;

    setName(user.name || "");
    setBlood(user.bloodGroup || "");
    setPhone(user.phone || "");
    setAddress(user.address || "");
    setEmergency(user.parentPhone || "");

  }, [user]);

  // ================= PICK IMAGE =================
  const pickImage = async () => {

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }

  };

  // ================= LOGOUT =================
  const confirmLogout = () => {

    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {

          await logout();

          router.replace("/(auth)/login");

          }
        }
      ]
    );

  };

  // ================= SAVE PROFILE =================
  const saveProfile = async () => {

    try {

      console.log("PROFILE UPDATE START");

      const res = await axios.put(
        `${API}/v1/auth/profile`,
        {
          name,
          bloodGroup: blood,
          phone,
          address,
          parentPhone: emergency,
        },
        {
          headers: {
            Authorization: userToken
          }
        }
      );

      console.log("PROFILE UPDATE RESPONSE", res.data);

      // update local state
      setUser(res.data);

      setEditing(false);

      Alert.alert("Profile Updated Successfully");

    } catch (err) {

      console.log("PROFILE UPDATE ERROR", err);

      Alert.alert("Profile update failed");

    }

  };

  return (

    <LinearGradient colors={["#141E30","#243B55"]} style={{flex:1}}>

      <ScrollView contentContainerStyle={styles.container}>

        <Text style={styles.title}>My Profile</Text>

        {/* AVATAR */}
        <Pressable onPress={pickImage}>

          {image ? (

            <Image source={{uri:image}} style={styles.avatar} />

          ) : (

            <View style={[styles.avatar,{justifyContent:"center",alignItems:"center"}]}>

              <Text style={{color:"#fff",fontSize:40,fontWeight:"bold"}}>
                {user?.email?.charAt(0)?.toUpperCase() || "U"}
              </Text>

            </View>

          )}

        </Pressable>

        <Pressable onPress={()=>setEditing(!editing)}>
          <Text style={styles.editBtn}>
            {editing ? "Close Edit" : "Edit Profile"}
          </Text>
        </Pressable>

        {/* DISPLAY MODE */}
        {!editing && (

          <View style={styles.displaySection}>

            <Text style={styles.displayName}>
              {name || "Your Name"}
            </Text>

            <Text style={styles.displaySub}>
              {blood ? `Blood Group: ${blood}` : ""}
            </Text>

            <Text style={styles.displaySub}>
              {address || "No address added"}
            </Text>

          </View>

        )}

        {/* EDIT MODE */}
        {editing && (

          <View style={styles.card}>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Blood Group</Text>

              <View style={styles.bloodContainer}>

                {["A+","A-","B+","B-","O+","AB+"].map((group)=>(

                  <Pressable
                    key={group}
                    onPress={()=>setBlood(group)}
                    style={[
                      styles.bloodOption,
                      blood===group && styles.bloodSelected
                    ]}
                  >

                    <Text style={{
                      color:blood===group?"#fff":"#000",
                      fontWeight:"bold"
                    }}>
                      {group}
                    </Text>

                  </Pressable>

                ))}

              </View>

            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Emergency Contact</Text>
              <TextInput
                style={styles.input}
                value={emergency}
                onChangeText={setEmergency}
                keyboardType="phone-pad"
              />
            </View>

            <AnimatedButton
              title="Save Profile"
              onPress={saveProfile}
            />

          </View>

        )}

        {/* SETTINGS */}
        <View style={styles.settingsSection}>

          <Text style={styles.settingsTitle}>Settings</Text>

          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
          </Pressable>

          <Pressable style={styles.settingItem}>
            <Text style={styles.settingText}>Privacy</Text>
          </Pressable>

        </View>

        {/* LOGOUT */}
        <Pressable style={styles.logoutBtn} onPress={confirmLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

      </ScrollView>

    </LinearGradient>

  );

}

const styles = StyleSheet.create({

  container:{padding:20,alignItems:"center"},
  title:{fontSize:26,fontWeight:"bold",color:"#fff",marginBottom:20},

  avatar:{
    width:120,
    height:120,
    borderRadius:60,
    borderWidth:3,
    borderColor:"#fff",
    marginBottom:10
  },

  editBtn:{marginTop:10,color:"#00F5FF",fontSize:16},

  displaySection:{marginTop:15,alignItems:"center"},

  displayName:{
    fontSize:20,
    color:"#fff",
    fontWeight:"bold"
  },

  displaySub:{
    fontSize:14,
    color:"#ccc",
    marginTop:4
  },

  card:{
    width:"100%",
    backgroundColor:"rgba(255,255,255,0.15)",
    padding:20,
    borderRadius:20,
    marginTop:20
  },

  field:{marginBottom:18},

  label:{
    color:"#fff",
    marginBottom:6,
    fontSize:14
  },

  input:{
    backgroundColor:"#fff",
    borderRadius:12,
    padding:14
  },

  bloodContainer:{
    flexDirection:"row",
    flexWrap:"wrap"
  },

  bloodOption:{
    backgroundColor:"#fff",
    paddingVertical:8,
    paddingHorizontal:12,
    borderRadius:10,
    marginRight:8,
    marginBottom:8
  },

  bloodSelected:{
    backgroundColor:"#1f6feb"
  },

  settingsSection:{
    width:"100%",
    marginTop:30
  },

  settingsTitle:{
    color:"#fff",
    fontSize:18,
    marginBottom:10
  },

  settingItem:{
    padding:15,
    backgroundColor:"rgba(255,255,255,0.1)",
    borderRadius:12,
    marginBottom:10
  },

  settingText:{
    color:"#fff"
  },

  logoutBtn:{
    width:"100%",
    marginTop:30,
    backgroundColor:"#ff4d4d",
    padding:15,
    borderRadius:12,
    alignItems:"center"
  },

  logoutText:{
    color:"#fff",
    fontWeight:"bold",
    fontSize:16
  },

});