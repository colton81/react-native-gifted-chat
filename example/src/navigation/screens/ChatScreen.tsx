import { Ionicons } from "@expo/vector-icons";
import { FlashListProps } from "@shopify/flash-list";
import React, { useCallback, useEffect, useState } from "react";
import {
    FlatListProps,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    View,
} from "react-native";
import {
    Bubble,
    GiftedChat,
    IMessage,
    InputToolbar,
    Send,
    SystemMessage,
} from "react-native-gifted-chat";

interface ChatScreenProps {
    // Add any props you need
}

const ChatScreen: React.FC<ChatScreenProps> = () => {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
    const [messageCounter, setMessageCounter] = useState(5);

    // Initialize with some example messages
    useEffect(() => {
        setMessages([
            {
                _id: 1,
                text: "Hello! How can I help you today?",
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: "Support Agent",
                    avatar: "https://placeimg.com/140/140/any",
                },
            },
            {
                _id: 2,
                text: "Welcome to the chat!",
                createdAt: new Date(Date.now() - 60000),
                system: true,
                user: {
                    _id: 2,
                    name: "Support Agent",
                    avatar: "https://placeimg.com/140/140/any",
                },
            },
            {
                _id: 3,
                text: "Feel free to ask any questions.",
                createdAt: new Date(Date.now() - 120000),
                user: {
                    _id: 2,
                    name: "Support Agent",
                    avatar: "https://placeimg.com/140/140/any",
                },
            },
            {
                _id: 4,
                text: "This is a sample message.",
                createdAt: new Date(Date.now() - 180000),
                user: {
                    _id: 2,
                    name: "Support Agent",
                    avatar: "https://placeimg.com/140/140/any",
                },
            },
        ]);
    }, []);

    // Auto-add a new message every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const autoMessages = [
                "This is an automated message",
                "Just checking in!",
                "How are things going?",
                "Let me know if you need help",
                "Here to assist you!",
                "Any questions?",
                "Hope you're having a great day!",
                "Feel free to reach out anytime",
            ];

            const randomMessage =
                autoMessages[Math.floor(Math.random() * autoMessages.length)];

            const newMessage: IMessage = {
                _id: messageCounter,
                text: randomMessage,
                createdAt: new Date().setSeconds(
                    new Date().getSeconds() + (messageCounter * 10) * (messageCounter * 2),
                ),
                user: {
                    _id: 2,
                    name: "Support Agent",
                    avatar: "https://placeimg.com/140/140/any",
                },
            };

            setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, [newMessage]),
            );
            setMessageCounter((prev) => prev + 1);
        }, 3000);

        return () => clearInterval(interval);
    }, [messageCounter]);

    const onSend = useCallback((newMessages: IMessage[] = []) => {
        setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, newMessages),
        );

        // Simulate a response after 1 second
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const replyMessage: IMessage = {
                _id: Math.random().toString(),
                text: "Thanks for your message! This is an automated response.",
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: "Support Agent",
                    avatar: "https://placeimg.com/140/140/any",
                },
            };
            setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, [replyMessage]),
            );
        }, 1500);
    }, []);

    // Load earlier messages when scrolling to the top
    const onLoadEarlier = useCallback(() => {
        setIsLoadingEarlier(true);

        // Simulate loading older messages after a delay
        setTimeout(() => {
            const olderMessages: IMessage[] = [];
            const currentOldestMessage = messages[messages.length - 1];
            const oldestDate = currentOldestMessage?.createdAt
                ? new Date(currentOldestMessage.createdAt).getTime()
                : Date.now();

            // Generate 5 older messages
            for (let i = 0; i < 5; i++) {
                olderMessages.push({
                    _id: messageCounter + i,
                    text: `This is an older message ${i + 1}`,
                    createdAt: new Date(oldestDate - (i + 1) * 60000),
                    user: {
                        _id: 2,
                        name: "Support Agent",
                        avatar: "https://placeimg.com/140/140/any",
                    },
                });
            }

            setMessages((previousMessages) =>
                GiftedChat.prepend(previousMessages, olderMessages),
            );
            setMessageCounter((prev) => prev + 5);
            setIsLoadingEarlier(false);
        }, 1000);
    }, [messages, messageCounter]);

    // Custom bubble styling
    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: "#007AFF",
                    },
                    left: {
                        backgroundColor: "#E5E5EA",
                    },
                }}
                textStyle={{
                    right: {
                        color: "#FFFFFF",
                    },
                    left: {
                        color: "#000000",
                    },
                }}
            />
        );
    };

    // Custom send button
    const renderSend = (props: any) => {
        return (
            <Send {...props}>
                <View style={styles.sendButton}>
                    <Ionicons name="send" size={24} color="#007AFF" />
                </View>
            </Send>
        );
    };

    // Custom input toolbar
    const renderInputToolbar = (props: any) => {
        return (
            <InputToolbar
                {...props}
                containerStyle={styles.inputToolbar}
                primaryStyle={styles.inputPrimary}
            />
        );
    };

    // Custom system message
    const renderSystemMessage = (props: any) => {
        return <SystemMessage {...props} textStyle={styles.systemMessage} />;
    };
    const listProps: Partial<FlashListProps<IMessage>> = {
        contentInsetAdjustmentBehavior: "automatic",
        viewabilityConfig: {
            minimumViewTime: 200,
            viewAreaCoveragePercentThreshold: 0.1,
            waitForInteraction: false
        },
        // onViewableItemsChanged,
        contentContainerStyle: {
            flexGrow: 1,
            justifyContent: "flex-start"
        },
        keyboardDismissMode: "interactive",
        // Performance optimizations

        removeClippedSubviews: true,
        //maxToRenderPerBatch: 20,
        //updateCellsBatchingPeriod: 50,
        //initialNumToRender: 20,
        //getItemLayout: undefined, // Let FlatList calculate this for variable height messages
        onEndReachedThreshold: 0.9,
        //contentInset: { top: Platform.OS === "ios" ? -bottomoffsetHeight - 30 : 500 },

    };
    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <GiftedChat
                    messages={messages}
                    onSend={(messages) => onSend(messages)}
                    user={{
                        _id: 1,
                        name: "User",
                    }}
                    isTyping={isTyping}
                    renderBubble={renderBubble}
                    renderSend={renderSend}
                    renderInputToolbar={renderInputToolbar}
                    renderSystemMessage={renderSystemMessage}
                    alwaysShowSend
                    scrollToBottom
                    scrollToBottomComponent={() => (
                        <Ionicons name="chevron-down" size={24} color="#007AFF" />
                    )}
                    listViewProps={listProps}
                    placeholder="Type a message..."
                    showUserAvatar
                    renderUsernameOnMessage
                    timeTextStyle={{
                        left: { color: "#8E8E93" },
                        right: { color: "#FFFFFF" },
                    }}
                    loadEarlier={true}
                    onLoadEarlier={onLoadEarlier}
                    isLoadingEarlier={isLoadingEarlier}
                // Quick replies example (uncomment to use)
                // quickReplyStyle={{
                //   backgroundColor: '#007AFF',
                // }}
                // renderQuickReplies={(props) => (
                //   <QuickReplies {...props} />
                // )}
                />
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    sendButton: {
        marginRight: 10,
        marginBottom: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    inputToolbar: {
        borderTopWidth: 1,
        borderTopColor: "#E5E5EA",
        backgroundColor: "#FFFFFF",
        paddingVertical: 4,
    },
    inputPrimary: {
        alignItems: "center",
    },
    systemMessage: {
        color: "#8E8E93",
        fontSize: 12,
        fontWeight: "500",
    },
});

export default ChatScreen;
