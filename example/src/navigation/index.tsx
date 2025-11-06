import { createNativeBottomTabNavigator } from "@bottom-tabs/react-navigation";
import {
	createStaticNavigation,
	StaticParamList,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createStackNavigator } from "@react-navigation/stack";
import { Platform } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import ChatScreen from "./screens/ChatScreen";
import { Explore } from "./screens/Explore";
import { Home } from "./screens/Home";
import { NotFound } from "./screens/NotFound";

const ChatStack = createNativeStackNavigator({
	screens: {
		Chat: {
			screen: ChatScreen,
			options: {
				title: "Chat",
				headerShown: false,
			},
		},
	},
});
const ChatNonNativeStack = createStackNavigator({
	screens: {
		Chat: {
			screen: ChatScreen,
			options: {
				title: "Chat",
			},
		},
	},
});
const HomeTabs = createNativeBottomTabNavigator({
	screens: {
		NativeChat: {
			screen: ChatStack,
			options: {
				tabBarIcon: () => ({ sfSymbol: "message.fill" }),
			},
		},
		NonNativeChat: {
			screen: ChatScreen,
			options: {
				headerShown: false,
				tabBarIcon: () => ({ sfSymbol: "gear" }),
			},
		},
	},
});

const RootStack = createNativeStackNavigator({
	screens: {
		HomeTabs: {
			screen: HomeTabs,
			options: {
				headerShown: false,
			},
		},
		NotFound: {
			screen: NotFound,
			options: {
				title: "404",
			},
			linking: {
				path: "*",
			},
		},
	},
});

export const Navigation = createStaticNavigation(RootStack);

type RootStackParamList = StaticParamList<typeof RootStack>;

declare global {
	namespace ReactNavigation {
		interface RootParamList extends RootStackParamList {}
	}
}
