import React from "react";
import { View, Text, Image } from "react-native";


const CustomMarker = ({ title }) => {
  return (
    <View style={{ alignItems: "center" }}>
      <Image
        source={require("../assets/pin.png")} // your custom icon
        style={{ width: 40, height: 40 }}
        resizeMode="contain"
      />
      {title && (
        <Text style={{ color: "black", marginTop: 4, fontWeight: "600" }}>
          {title}
        </Text>
      )}
    </View>
  );
};

export default CustomMarker;
