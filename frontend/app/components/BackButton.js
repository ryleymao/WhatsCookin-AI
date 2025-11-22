import React from "react";
import { TouchableOpacity, Image, StyleSheet } from "react-native";
import { getStatusBarHeight } from "react-native-status-bar-height";
import { useRouter } from 'expo-router'

export default function BackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={router.back()} style={styles.container}>
      <Image
        style={styles.image}
        source={require('../assets/items/back.png')}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10 + getStatusBarHeight(),
    left: 4,
  },
  image: {
    width: 24,
    height: 24,
  },
});
