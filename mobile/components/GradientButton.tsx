import { Pressable, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function GradientButton({ title, onPress }: any) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={["#1f6feb", "#00F5FF"]}
        style={styles.btn}
      >
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});