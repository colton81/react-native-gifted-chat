import { IMessage } from "./types";
export declare function isSameDay(currentMessage: IMessage, diffMessage: IMessage | null | undefined): boolean;
export declare function isSameUser(currentMessage: IMessage, diffMessage: IMessage | null | undefined): boolean;
export declare function useCallbackDebounced(time: number, callbackFunc: (...args: any[]) => void, deps?: any[]): () => void;
export declare function useCallbackThrottled(time: number, callbackFunc: (...args: any[]) => void, deps?: any[]): () => void;
