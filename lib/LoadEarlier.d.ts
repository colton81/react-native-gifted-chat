import React from "react";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
export interface LoadEarlierProps {
    isLoadingEarlier?: boolean;
    label?: string;
    containerStyle?: StyleProp<ViewStyle>;
    wrapperStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    activityIndicatorStyle?: StyleProp<ViewStyle>;
    activityIndicatorColor?: string;
    activityIndicatorSize?: number | "small" | "large";
    onLoadEarlier?(): void;
}
export declare function LoadEarlier({ isLoadingEarlier, onLoadEarlier, label, containerStyle, wrapperStyle, textStyle, activityIndicatorColor, activityIndicatorSize, activityIndicatorStyle, }: LoadEarlierProps): React.ReactElement;
