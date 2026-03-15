import { View, TextInput, Text, StyleSheet } from "react-native";
import { useState } from "react";

export default function FloatingInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  rightIcon,
}: any) {
  const [focus, setFocus] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, (focus || value) && styles.labelFocus]}>
        {label}
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          style={styles.input}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
        />

        {rightIcon}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },

  label: {
    position: "absolute",
    left: 12,
    top: 16,
    color: "#aaa",
    fontSize: 14,
  },

  labelFocus: {
    top: -10,
    fontSize: 12,
    color: "#00F5FF",
  },

  inputWrapper: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 55,
    justifyContent: "center",
  },

  input: {
    color: "#fff",
    fontSize: 16,
  },
});