import { View } from "react-native";
import FlashMessage from "react-native-flash-message";
import GeminiChat from "../services/GeminiChat";
import { StyleSheet } from "react-native";

const ChatBotScreen = () => {
    return (
        <View style={styles.container}>
            <GeminiChat />
            <FlashMessage position={"top"} />
        </View>
    );
}

export default ChatBotScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
