import LottieView from "lottie-react-native";
import { View } from "react-native";

export default function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <LottieView
        source={require("../assets/ambulance.json")}
        autoPlay
        loop={false}
      />
    </View>
  );
}