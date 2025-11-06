import dayjs from "dayjs";
import { useCallback, useEffect, useRef } from "react";
export function isSameDay(currentMessage, diffMessage) {
    if (!diffMessage || !diffMessage.createdAt) {
        return false;
    }
    const currentCreatedAt = dayjs(currentMessage.createdAt);
    const diffCreatedAt = dayjs(diffMessage.createdAt);
    if (!currentCreatedAt.isValid() || !diffCreatedAt.isValid()) {
        return false;
    }
    return currentCreatedAt.isSame(diffCreatedAt, "day");
}
export function isSameUser(currentMessage, diffMessage) {
    return !!(diffMessage &&
        diffMessage.user &&
        currentMessage.user &&
        diffMessage.user._id === currentMessage.user._id);
}
function processCallbackArguments(args) {
    const [e, ...rest] = args;
    const { nativeEvent } = e || {};
    let params = [];
    if (e) {
        if (nativeEvent) {
            params.push({ nativeEvent });
        }
        else {
            params.push(e);
        }
        if (rest) {
            params = params.concat(rest);
        }
    }
    return params;
}
export function useCallbackDebounced(time, callbackFunc, deps = []) {
    const timeoutId = useRef(undefined);
    // we use function instead of arrow to access arguments object
    // biome-ignore lint/correctness/useExhaustiveDependencies: we have to depend on deps
    const savedFunc = useCallback(function () {
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;
        const params = processCallbackArguments(args);
        clearTimeout(timeoutId.current);
        timeoutId.current = setTimeout(() => {
            callbackFunc(...params);
        }, time);
    }, [callbackFunc, time, deps]);
    useEffect(() => {
        return () => {
            clearTimeout(timeoutId.current);
        };
    }, []);
    return savedFunc;
}
export function useCallbackThrottled(time, callbackFunc, deps = []) {
    const lastExecution = useRef(0);
    const timeoutId = useRef(undefined);
    // we use function instead of arrow to access arguments object
    // biome-ignore lint/correctness/useExhaustiveDependencies: we have to depend on deps
    const savedFunc = useCallback(function () {
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;
        const params = processCallbackArguments(args);
        const now = Date.now();
        const timeSinceLastExecution = now - lastExecution.current;
        if (timeSinceLastExecution >= time) {
            // Execute immediately if enough time has passed
            lastExecution.current = now;
            callbackFunc(...params);
        }
        else {
            // Schedule execution for the remaining time
            clearTimeout(timeoutId.current);
            timeoutId.current = setTimeout(() => {
                lastExecution.current = Date.now();
                callbackFunc(...params);
            }, time - timeSinceLastExecution);
        }
    }, [callbackFunc, time, deps]);
    useEffect(() => {
        return () => {
            clearTimeout(timeoutId.current);
        };
    }, []);
    return savedFunc;
}
//# sourceMappingURL=utils.js.map