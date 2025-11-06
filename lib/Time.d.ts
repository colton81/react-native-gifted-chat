import React from "react";
import { TextStyle, ViewStyle } from "react-native";
import { IMessage, LeftRightStyle } from "./types";
export interface TimeProps<TMessage extends IMessage> {
    position?: "left" | "right";
    currentMessage: TMessage;
    containerStyle?: LeftRightStyle<ViewStyle>;
    timeTextStyle?: LeftRightStyle<TextStyle>;
    timeFormat?: string;
}
export declare function Time<TMessage extends IMessage = IMessage>({ position, containerStyle, currentMessage, timeFormat, timeTextStyle, }: TimeProps<TMessage>): React.JSX.Element | null;
