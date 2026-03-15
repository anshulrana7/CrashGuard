import { View, Animated, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";

export default function ParticlesBackground() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -300],
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.circle,
          {
            transform: [{ translateY }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(0,245,255,0.15)",
    position: "absolute",
    bottom: -100,
    left: 100,
  },
});