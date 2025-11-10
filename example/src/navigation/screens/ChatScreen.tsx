import { Ionicons } from "@expo/vector-icons";
import { FlashListProps } from "@shopify/flash-list";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    View,
    ActivityIndicator,
    SafeAreaView,
} from "react-native";
import {
    Bubble,
    Day,
    GiftedChat,
    IMessage,
    InputToolbar,
    Send,
    SystemMessage,
} from "react-native-gifted-chat";
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";

// Types
interface ChatMessage extends IMessage {
    _id: string | number;
    text: string;
    createdAt: Date | number;
    user: {
        _id: string | number;
        name?: string;
        avatar?: string;
    };
    system?: boolean;
}

interface MessagesResponse {
    messages: ChatMessage[];
    nextCursor: string | null;
    hasMore: boolean;
}

// Mock API functions
const mockApi = {
    // Simulate fetching paginated messages
    fetchMessages: async ({ cursor }: { cursor?: string }): Promise<MessagesResponse> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const pageSize = 20;
        const cursorNum = cursor ? parseInt(cursor) : 0;

        // Generate mock messages based on cursor
        const messages: ChatMessage[] = [];
        const startId = cursorNum * pageSize;

        for (let i = 0; i < pageSize; i++) {
            const messageId = startId + i;
            const timestamp = Date.now() - (messageId * 1200000); // Each message is 1 minute older

            // Add variety to messages
            if (messageId === 0) {
                // Most recent message
                messages.push({
                    _id: messageId,
                    text: "Hello! How can I help you today?",
                    createdAt: new Date(timestamp),
                    user: {
                        _id: 2,
                        name: "Support Agent",
                        avatar: "https://placeimg.com/140/140/any",
                    },
                });
            } else if (messageId % 10 === 0) {
                // System messages every 10 messages
                messages.push({
                    _id: messageId,
                    text: `System notification #${messageId / 10}`,
                    createdAt: new Date(timestamp),
                    system: true,
                    user: {
                        _id: "system",
                        name: "System",
                    },
                });
            } else {
                // Regular messages
                const messageTemplates = [
                    "Thanks for reaching out!",
                    "Let me check that for you.",
                    "Here's what I found:",
                    "Is there anything else you need?",
                    "I understand your concern.",
                    "That's a great question!",
                    "Let me explain how this works.",
                    "Feel free to ask any questions.",
                ];

                messages.push({
                    _id: messageId,
                    text: `${messageTemplates[messageId % messageTemplates.length]} (Message #${messageId})`,
                    createdAt: new Date(timestamp),
                    user: {
                        _id: 2,
                        name: "Support Agent",
                        avatar: "https://placeimg.com/140/140/any",
                    },
                });
            }
        }

        // Simulate having 100 total messages (5 pages)
        const hasMore = cursorNum < 4;
        const nextCursor = hasMore ? String(cursorNum + 1) : null;

        return {
            messages,
            nextCursor,
            hasMore,
        };
    },

    // Simulate sending a message
    sendMessage: async (message: ChatMessage): Promise<ChatMessage> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return the message with server-assigned properties
        return {
            ...message,
            _id: `sent_${Date.now()}`,
            createdAt: new Date(),
        };
    },

    // Simulate getting a bot response
    getBotResponse: async (userMessage: string): Promise<ChatMessage> => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const responses = [
            "Thanks for your message! I've received it successfully.",
            "I understand what you're saying. Let me help you with that.",
            "That's interesting! Tell me more about it.",
            "I'll look into that for you right away.",
            "Great question! Here's what I think...",
        ];

        return {
            _id: `bot_${Date.now()}`,
            text: responses[Math.floor(Math.random() * responses.length)],
            createdAt: new Date(),
            user: {
                _id: 2,
                name: "Support Agent",
                avatar: "https://placeimg.com/140/140/any",
            },
        };
    },
};

// Chat Screen Component
interface ChatScreenProps {
    // Add any props you need
}

const ChatScreenContent: React.FC<ChatScreenProps> = () => {
    const [isTyping, setIsTyping] = useState(false);
    const queryClient = useQueryClient();

    // Fetch messages with infinite query
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch,
    } = useInfiniteQuery({
        queryKey: ["chatMessages"],
        queryFn: ({ pageParam }) => mockApi.fetchMessages({ cursor: pageParam }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
        gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: mockApi.sendMessage,
        onMutate: async (newMessage) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["chatMessages"] });

            // Snapshot the previous value
            const previousMessages = queryClient.getQueryData(["chatMessages"]);

            // Optimistically update to the new value
            queryClient.setQueryData(["chatMessages"], (old: any) => {
                if (!old) return old;

                const newPages = [...old.pages];
                newPages[0] = {
                    ...newPages[0],
                    messages: [newMessage, ...newPages[0].messages],
                };

                return {
                    ...old,
                    pages: newPages,
                };
            });

            // Return a context object with the snapshotted value
            return { previousMessages };
        },
        onError: (err, newMessage, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousMessages) {
                queryClient.setQueryData(["chatMessages"], context.previousMessages);
            }
        },
        onSuccess: async (sentMessage) => {
            // Trigger bot response
            setIsTyping(true);

            try {
                const botResponse = await mockApi.getBotResponse(sentMessage.text);

                // Add bot response to the messages
                queryClient.setQueryData(["chatMessages"], (old: any) => {
                    if (!old) return old;

                    const newPages = [...old.pages];
                    newPages[0] = {
                        ...newPages[0],
                        messages: [botResponse, ...newPages[0].messages],
                    };

                    return {
                        ...old,
                        pages: newPages,
                    };
                });
            } finally {
                setIsTyping(false);
            }
        },
    });

    // Transform paginated data to flat array for GiftedChat
    const messages = useMemo(() => {
        if (!data?.pages) return [];

        // Flatten all pages and reverse to get newest first
        const allMessages = data.pages.flatMap(page => page.messages);

        // GiftedChat expects newest messages first
        return allMessages.sort((a, b) => {
            const aTime = new Date(a.createdAt).getTime();
            const bTime = new Date(b.createdAt).getTime();
            return bTime - aTime;
        });
    }, [data]);

    // Auto-add new messages periodically (simulate real-time updates)
    useEffect(() => {
        const interval = setInterval(() => {
            const autoMessages = [
                "📢 New notification!",
                "💬 Someone joined the chat",
                "✨ Special announcement",
                "🔔 Reminder: Check your settings",
                "📧 You have a new message",
                "🚀 Update: New features available",
                "🎉 Congrats! You've unlocked a badge",
                "⚠️ Alert: Please verify your email",
                "🔒 Security: Your password has been changed",
                "🌟 Tip: Customize your profile for better experience",
                "📅 Event: Don't miss our upcoming webinar",
                "🛠️ Maintenance: Scheduled downtime tonight",
                "💡 Did you know? You can use shortcuts",
                "📊 Stats: Your activity summary is ready",
                "🎁 Gift: Claim your reward now",
                "📰 News: Latest updates in your feed",
                "📍 Location: New places added to explore",
                "🎶 Music: Check out the new playlist",
                "📷 Photo: New images uploaded",
                "🎬 Video: Watch the latest clips",
                "🛍️ Shop: Check out the latest deals",
                "🍔 Food: New recipes to try",
                "🏆 Achievement: You've reached a new level!",
                "📚 Learning: New courses available",
                "🌐 Connection: New friends suggested",
                "💼 Career: Job opportunities for you",
                "🏡 Home: New listings in your area",
                "🌍 Travel: Explore new destinations",
                "💪 Fitness: New workout plans",
                "🧘 Wellness: Tips for a healthier you",
            ];

            const randomMessage = autoMessages[Math.floor(Math.random() * autoMessages.length)];

            const newMessage: ChatMessage = {
                _id: `auto_${Date.now()}`,
                text: randomMessage,
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: "Support Agent",
                    avatar: "https://placeimg.com/140/140/any",
                },
            };

            // Add to the first page of messages
            queryClient.setQueryData(["chatMessages"], (old: any) => {
                if (!old) return old;

                const newPages = [...old.pages];
                newPages[0] = {
                    ...newPages[0],
                    messages: [newMessage, ...newPages[0].messages],
                };

                return {
                    ...old,
                    pages: newPages,
                };
            });
        }, 10000); // Every 10 seconds

        return () => clearInterval(interval);
    }, [queryClient]);

    // Handle sending messages
    const onSend = useCallback((newMessages: IMessage[] = []) => {
        const message = newMessages[0];
        if (message) {
            const messageToSend: ChatMessage = {
                ...message,
                _id: `temp_${Date.now()}`,
                createdAt: new Date(),
                user: {
                    _id: 1,
                    name: "User",
                },
            };

            sendMessageMutation.mutate(messageToSend);
        }
    }, [sendMessageMutation]);

    // Load earlier messages when scrolling to the top
    const onLoadEarlier = useCallback(() => {
        console.log("Loading earlier messages...");
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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


        viewabilityConfig: {
            minimumViewTime: 200,
            viewAreaCoveragePercentThreshold: 0.1,
            waitForInteraction: false
        },
        contentContainerStyle: {
            flexGrow: 1,
            justifyContent: "flex-start"
        },
        keyboardDismissMode: "interactive",
        removeClippedSubviews: true,
        onEndReachedThreshold: 0.9,
    };

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    // Error state
    if (isError) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color="#FF3B30" />
                <View style={styles.errorText}>
                    <Text style={styles.errorTitle}>Failed to load messages</Text>
                    <Text style={styles.errorMessage}>
                        {error?.message || "An unexpected error occurred"}
                    </Text>
                </View>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

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
                renderDay={(props) => {
                    <Day
                        textStyle={{
                            color: "black",
                            fontSize: 16
                        }}
                        wrapperStyle={{
                            backgroundColor: "transparent"
                        }}
                        containerStyle={{
                            backgroundColor: "transparent",
                            alignItems: "flex-start",
                            borderBottomColor: "#8E8E93",
                            borderBottomWidth: 1
                        }}
                        createdAt={props.createdAt}
                    />
                }}
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
                infiniteScroll={true}
                loadEarlier={hasNextPage}
                onLoadEarlier={onLoadEarlier}
                isLoadingEarlier={isFetchingNextPage}
                dayOffset={{ top: 50 }}

            />

        </SafeAreaView>
    );
};

// Add missing imports for Text and TouchableOpacity
import { Text, TouchableOpacity } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 20,
    },
    errorText: {
        marginTop: 16,
        alignItems: "center",
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#000000",
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: "#8E8E93",
        textAlign: "center",
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: "#007AFF",
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 16,
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

// Main component wrapped with QueryClient
const ChatScreen: React.FC<ChatScreenProps> = (props) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: 2,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <ChatScreenContent {...props} />
        </QueryClientProvider>
    );
};

export default ChatScreen;