import { createContext, useContext } from "react";
export const GiftedChatContext = createContext({
    getLocale: () => "en",
    actionSheet: () => ({
        showActionSheetWithOptions: () => {
            // do nothing
        },
    }),
});
export const useChatContext = () => useContext(GiftedChatContext);
//# sourceMappingURL=GiftedChatContext.js.map