import { ActionSheetOptions } from "@expo/react-native-action-sheet";
import { createContext, useContext } from "react";

export interface IGiftedChatContext {
	actionSheet(): {
		showActionSheetWithOptions: (
			options: ActionSheetOptions,
			callback: (buttonIndex?: number) => void | Promise<void>,
		) => void;
	};
	getLocale(): string;
}

export const GiftedChatContext = createContext<IGiftedChatContext>({
	getLocale: () => "en",
	actionSheet: () => ({
		showActionSheetWithOptions: () => {
			// do nothing
		},
	}),
});

export const useChatContext = () => useContext(GiftedChatContext);
