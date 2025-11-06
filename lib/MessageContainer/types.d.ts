import { FlashListProps, FlashListRef } from "@shopify/flash-list";
import React, { RefObject } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import { LoadEarlierProps } from "../LoadEarlier";
import { MessageProps } from "../Message";
import { DayProps, IMessage, Reply, User } from "../types";
export type ListViewProps<TMessage extends IMessage = IMessage> = Partial<FlashListProps<TMessage>>;
export interface MessageContainerProps<TMessage extends IMessage = IMessage> {
    forwardRef?: RefObject<FlashListRef<TMessage>>;
    messages?: TMessage[];
    isTyping?: boolean;
    user?: User;
    listViewProps?: ListViewProps;
    inverted?: boolean;
    loadEarlier?: boolean;
    alignTop?: boolean;
    isScrollToBottomEnabled?: boolean;
    scrollToBottomStyle?: StyleProp<ViewStyle>;
    invertibleScrollViewProps?: object;
    extraData?: object;
    scrollToBottomOffset?: number;
    renderChatEmpty?(): React.ReactNode;
    renderFooter?(props: MessageContainerProps<TMessage>): React.ReactNode;
    renderMessage?(props: MessageProps<TMessage>): React.ReactElement;
    renderDay?(props: DayProps): React.ReactNode;
    renderLoadEarlier?(props: LoadEarlierProps): React.ReactNode;
    renderTypingIndicator?(): React.ReactNode;
    scrollToBottomComponent?(): React.ReactNode;
    onLoadEarlier?(): void;
    onQuickReply?(replies: Reply[]): void;
    infiniteScroll?: boolean;
    isLoadingEarlier?: boolean;
    handleOnScroll?(event: ReanimatedScrollEvent): void;
}
export interface State {
    showScrollBottom: boolean;
    hasScrolled: boolean;
}
interface ViewLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}
export type DaysPositions = {
    [key: string]: ViewLayout & {
        createdAt: number;
    };
};
export {};
