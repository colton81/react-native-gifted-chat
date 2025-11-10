import { FlashList } from "@shopify/flash-list";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CellRendererProps,
  LayoutChangeEvent,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import { LoadEarlier } from "../LoadEarlier";
import { warning } from "../logging";
import stylesCommon from "../styles";
import TypingIndicator from "../TypingIndicator";
import { IMessage } from "../types";
import { isSameDay, useCallbackThrottled } from "../utils";
import DayAnimated from "./components/DayAnimated";
import Item from "./components/Item";
import { ItemProps } from "./components/Item/types";
import styles from "./styles";
import { DaysPositions, MessageContainerProps } from "./types";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Day } from "../Day";
export * from "./types";

// Type for list items that can be either a message or a date header
type ListItem<TMessage extends IMessage = IMessage> =
  | { type: 'message'; data: TMessage; index: number }
  | { type: 'header'; data: { date: Date | number }; index: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<any>);

// Helper function to transform messages into a list with date headers
function createMessagesWithHeaders<TMessage extends IMessage>(
  messages: TMessage[],
): ListItem<TMessage>[] {
  const result: ListItem<TMessage>[] = [];
  let lastDate: Date | null = null;

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt);
    const shouldAddHeader =
      !lastDate ||
      messageDate.getDate() !== lastDate.getDate() ||
      messageDate.getMonth() !== lastDate.getMonth() ||
      messageDate.getFullYear() !== lastDate.getFullYear();

    if (shouldAddHeader) {
      result.push({
        type: 'header',
        data: { date: message.createdAt },
        index: result.length,
      });
      lastDate = new Date(messageDate);
    }

    result.push({
      type: 'message',
      data: message,
      index: result.length,
    });
  });

  return result;
}

function MessageContainer<TMessage extends IMessage = IMessage>(
  props: MessageContainerProps<TMessage>,
) {
  const {
    messages = [],
    user,
    isTyping = false,
    renderChatEmpty: renderChatEmptyProp,
    onLoadEarlier,
    inverted = false,
    loadEarlier = false,
    listViewProps,
    invertibleScrollViewProps,
    extraData = null,
    isScrollToBottomEnabled = false,
    scrollToBottomOffset = 200,
    alignTop = false,
    scrollToBottomStyle,
    infiniteScroll = false,
    isLoadingEarlier = false,
    renderTypingIndicator: renderTypingIndicatorProp,
    renderFooter: renderFooterProp,
    renderLoadEarlier: renderLoadEarlierProp,
    forwardRef,
    handleOnScroll: handleOnScrollProp,
    scrollToBottomComponent: scrollToBottomComponentProp,
    renderDay: renderDayProp,
    renderFloatingDay,
  } = props;
  const insets = useSafeAreaInsets();
  const scrollToBottomOpacity = useSharedValue(0);
  const isScrollingDown = useSharedValue(false);
  const lastScrolledY = useSharedValue(0);
  const [isScrollToBottomVisible, setIsScrollToBottomVisible] = useState(false);
  const scrollToBottomStyleAnim = useAnimatedStyle(
    () => ({
      opacity: scrollToBottomOpacity.value,
    }),
    [scrollToBottomOpacity],
  );

  const daysPositions = useSharedValue<DaysPositions>({});
  const listHeight = useSharedValue(0);
  const scrolledY = useSharedValue(0);

  // Transform messages to include date headers
  const listData = useMemo(
    () => createMessagesWithHeaders(messages),
    [messages],
  );

  const renderTypingIndicator = useCallback(() => {
    if (renderTypingIndicatorProp) { return <>{renderTypingIndicatorProp()}</>; }

    return <TypingIndicator isTyping={isTyping} />;
  }, [isTyping, renderTypingIndicatorProp]);

  const ListFooterComponent = useMemo(() => {
    if (renderFooterProp) { return <>{renderFooterProp(props)}</>; }

    return renderTypingIndicator();
  }, [renderFooterProp, renderTypingIndicator, props]);

  const renderLoadEarlier = useCallback(() => {
    if (loadEarlier) {
      if (renderLoadEarlierProp) { return renderLoadEarlierProp(props); }

      return <LoadEarlier {...props} />;
    }

    return null;
  }, [loadEarlier, renderLoadEarlierProp, props]);

  const changeScrollToBottomVisibility: (isVisible: boolean) => void =
    useCallbackThrottled(
      50,
      (isVisible: boolean) => {
        if (isScrollingDown.value && isVisible) { return; }

        if (isVisible) { setIsScrollToBottomVisible(true); }

        scrollToBottomOpacity.value = withTiming(
          isVisible ? 1 : 0,
          { duration: 250 },
          (isFinished) => {
            if (isFinished && !isVisible) {
              runOnJS(setIsScrollToBottomVisible)(false);
            }
          },
        );
      },
      [scrollToBottomOpacity],
    );

  const scrollTo = useCallback(
    (options: { animated?: boolean; offset: number }) => {
      if (options) { forwardRef?.current?.scrollToOffset(options); }
    },
    [forwardRef],
  );

  const doScrollToBottom = useCallback(
    (animated: boolean = true) => {
      isScrollingDown.value = true;
      changeScrollToBottomVisibility(false);

      if (inverted) { scrollTo({ offset: 0, animated }); }
      else if (forwardRef?.current) {
        forwardRef.current.scrollToEnd({ animated });
      }
    },
    [
      forwardRef,
      inverted,
      scrollTo,
      isScrollingDown,
      changeScrollToBottomVisibility,
    ],
  );

  const handleOnScroll = useCallback(
    (event: ReanimatedScrollEvent) => {
      handleOnScrollProp?.(event);

      const {
        contentOffset: { y: contentOffsetY },
        contentSize: { height: contentSizeHeight },
        layoutMeasurement: { height: layoutMeasurementHeight },
      } = event;

      isScrollingDown.value =
        (inverted && lastScrolledY.value > contentOffsetY) ||
        (!inverted && lastScrolledY.value < contentOffsetY);

      lastScrolledY.value = contentOffsetY;

      if (inverted) {
        if (contentOffsetY > scrollToBottomOffset!) {
          changeScrollToBottomVisibility(true);
        }
        else { changeScrollToBottomVisibility(false); }
      }
      else if (
        contentOffsetY < scrollToBottomOffset! &&
        contentSizeHeight - layoutMeasurementHeight > scrollToBottomOffset!
      ) {
        changeScrollToBottomVisibility(false);
      }
      else { changeScrollToBottomVisibility(false); }
    },
    [
      handleOnScrollProp,
      inverted,
      scrollToBottomOffset,
      changeScrollToBottomVisibility,
      isScrollingDown,
      lastScrolledY,
    ],
  );

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: ListItem<TMessage>;
      index: number;
    }): React.ReactElement | null => {
      // Render date header
      if (item.type === 'header') {
        const dayProps = {
          ...props,
          createdAt: item.data.date,
        };

        return renderDayProp ? (
          <View>{renderDayProp(dayProps)}</View>
        ) : (
          <Day {...dayProps} />
        );
      }

      // Render message
      const messageItem = item.data;

      if (!messageItem._id && messageItem._id !== 0) {
        warning(
          "GiftedChat: `_id` is missing for message",
          JSON.stringify(item),
        );
      }

      if (!messageItem.user) {
        if (!messageItem.system) {
          warning(
            "GiftedChat: `user` is missing for message",
            JSON.stringify(messageItem),
          );
        }

        messageItem.user = { _id: 0 };
      }

      const { messages, ...restProps } = props;

      if (messages && user) {
        // Find the actual message index in the original messages array
        const messageIndex = messages.findIndex((m) => m._id === messageItem._id);
        const previousMessage = messages[messageIndex - 1];
        const nextMessage = messages[messageIndex + 1];

        const messageProps: ItemProps<TMessage> = {
          ...restProps,
          currentMessage: messageItem,
          previousMessage,
          nextMessage,
          position: messageItem.user._id === user._id ? "right" : "left",
          scrolledY,
          daysPositions,
          listHeight,
        };

        return <Item<TMessage> {...messageProps} />;
      }

      return null;
    },
    [props, scrolledY, daysPositions, listHeight, user, renderDayProp],
  );

  const renderChatEmpty = useCallback(() => {
    if (renderChatEmptyProp) {
      return inverted ? (
        renderChatEmptyProp()
      ) : (
        <View style={[stylesCommon.fill, styles.emptyChatContainer]}>
          {renderChatEmptyProp()}
        </View>
      );
    }

    return <View style={stylesCommon.fill} />;
  }, [inverted, renderChatEmptyProp]);

  const ListHeaderComponent = useMemo(() => {
    const content = renderLoadEarlier();

    if (!content) { return null; }

    return <View style={stylesCommon.fill}>{content}</View>;
  }, [renderLoadEarlier]);

  const renderScrollBottomComponent = useCallback(() => {
    if (scrollToBottomComponentProp) { return scrollToBottomComponentProp(); }

    return <Text>{"V"}</Text>;
  }, [scrollToBottomComponentProp]);

  const ScrollToBottomWrapper = useCallback(() => {
    if (!isScrollToBottomEnabled) { return null; }

    if (!isScrollToBottomVisible) { return null; }

    return (
      <Pressable
        style={styles.scrollToBottom}
        onPress={() => doScrollToBottom()}
      >
        <Animated.View
          style={[
            stylesCommon.centerItems,
            styles.scrollToBottomContent,
            scrollToBottomStyle,
            scrollToBottomStyleAnim,
          ]}
        >
          {renderScrollBottomComponent()}
        </Animated.View>
      </Pressable>
    );
  }, [
    scrollToBottomStyle,
    renderScrollBottomComponent,
    doScrollToBottom,
    scrollToBottomStyleAnim,
    isScrollToBottomEnabled,
    isScrollToBottomVisible,
  ]);

  const onLayoutList = useCallback(
    (event: LayoutChangeEvent) => {
      listHeight.value = event.nativeEvent.layout.height;

      if (messages?.length && isScrollToBottomEnabled) {
        setTimeout(() => {
          doScrollToBottom(false);
        }, 500);
      }

      listViewProps?.onLayout?.(event);
    },
    [

      messages,
      doScrollToBottom,
      listHeight,
      listViewProps,
      isScrollToBottomEnabled,
    ],
  );

  const onStartReached = useCallback(() => {
    if (
      infiniteScroll &&
      loadEarlier &&
      onLoadEarlier &&
      !isLoadingEarlier &&
      Platform.OS !== "web"
    ) {
      onLoadEarlier();
    }
  }, [infiniteScroll, loadEarlier, onLoadEarlier, isLoadingEarlier]);

  const keyExtractor = useCallback(
    (item: ListItem<TMessage>, index: number) => {
      if (item.type === 'header') {
        return `header-${new Date(item.data.date).toDateString()}-${index}`;
      }
      return `message-${item.data._id}-${item.data.createdAt}-${index}`;
    },
    [],
  );

  const getItemType = useCallback((item: ListItem<TMessage>) => {
    return item.type;
  }, []);

  const renderCell = useCallback(
    (props: CellRendererProps<unknown>) => {
      const { onLayout: onLayoutProp, children } = props;
      const childArray = React.Children.toArray(children);
      const firstChild = childArray[0] as React.ReactElement;

      // Check if this is a header or message item
      // @ts-expect-error - currentMessage exists on message items
      const item = firstChild?.props?.currentMessage as IMessage | undefined;

      // If no currentMessage, this is likely a header - just render without tracking
      if (!item) {
        return (
          <View {...props} onLayout={onLayoutProp}>
            {children}
          </View>
        );
      }

      /**
       * Handles the layout event for a message item, updating the shared value with position information.
       * 
       * This function tracks the vertical position and height of message items, managing a collection
       * of day positions by removing outdated entries for the same day and adding the current item's
       * layout data. It ensures only the most relevant position data is kept based on the inverted
       * scroll direction.
       * 
       * @param event - The layout change event containing the new layout measurements
       * @param event.nativeEvent.layout - Layout object with position and dimension data
       * @param event.nativeEvent.layout.y - The y-coordinate of the item relative to its parent
       * @param event.nativeEvent.layout.height - The height of the item in pixels
       * 
       * @remarks
       * - Calls the optional `onLayoutProp` callback if provided
       * - Returns early if no `item` is available
       * - Uses a worklet function to modify shared values for optimal performance
       * - Removes existing entries for the same day based on scroll direction (inverted vs normal)
       * - Stores position data indexed by the item's string ID
       */
      const handleOnLayout = (event: LayoutChangeEvent) => {
        onLayoutProp?.(event);

        if (!item) { return; }

        const { y, height } = event.nativeEvent.layout;
        const id = item._id.toString();

        const newValue = {
          y,
          height,
          createdAt: new Date(item.createdAt).getTime(),
        };

        daysPositions.modify((value) => {
          "worklet";

          const isSameDay = (date1: number, date2: number) => {
            const d1 = new Date(date1);
            const d2 = new Date(date2);

            return (
              d1.getDate() === d2.getDate() &&
              d1.getMonth() === d2.getMonth() &&
              d1.getFullYear() === d2.getFullYear()
            );
          };

          for (const [key, item] of Object.entries(value)) {
            if (
              !isSameDay(newValue.createdAt, item.createdAt) &&
              item.y <= newValue.y
            ) {
              console.log("Removing day position for key:", key);
              delete value[key];
              break;
            }
          }

          // @ts-expect-error: https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue#remarks
          value[id] = newValue;
          return value;
        });
      };

      return (
        <View {...props} onLayout={handleOnLayout} >
          {children}
        </View>
      );
    },
    [daysPositions, inverted],
  );

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        scrolledY.value = event.contentOffset.y;

        runOnJS(handleOnScroll)(event);
      },
    },
    [handleOnScroll],
  );

  // removes unrendered days positions when messages are added/removed
  useEffect(() => {
    Object.keys(daysPositions.value).forEach((key) => {
      const messageIndex = messages.findIndex((m) => m._id.toString() === key);
      let shouldRemove = messageIndex === -1;

      if (!shouldRemove) {
        const prevMessage = messages[messageIndex + (inverted ? 1 : -1)];
        const message = messages[messageIndex];
        shouldRemove = !!prevMessage && isSameDay(message, prevMessage);
      }

      if (shouldRemove) {
        daysPositions.modify((value) => {
          "worklet";

          delete value[key];
          return value;
        });
      }
    });
  }, [messages, daysPositions, inverted]);


  return (
    <View
      style={[
        styles.contentContainerStyle,
        alignTop ? styles.containerAlignTop : stylesCommon.fill,
      ]}
    >
      <AnimatedFlashList
        ref={forwardRef}
        data={listData}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        automaticallyAdjustContentInsets={true}
        contentInset={{ top: insets.top, bottom: insets.bottom }}
        contentInsetAdjustmentBehavior={"automatic"}
        {...invertibleScrollViewProps}
        ListEmptyComponent={renderChatEmpty}
        ListFooterComponent={ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        onScroll={scrollHandler}
        scrollEventThrottle={1}
        onStartReached={onStartReached}
        onStartReachedThreshold={0.05}

        {...listViewProps}
        onLayout={onLayoutList}
        CellRendererComponent={renderCell}
        maintainVisibleContentPosition={{
          autoscrollToBottomThreshold: 0.2,
          autoscrollToTopThreshold: 0.2,
          startRenderingFromBottom: true,
        }}
      />
      <ScrollToBottomWrapper />
      <DayAnimated
        scrolledY={scrolledY}
        daysPositions={daysPositions}
        listHeight={listHeight}
        renderDay={renderFloatingDay}
        messages={messages}
        isLoadingEarlier={isLoadingEarlier}
      />
    </View>
  );
}

export default MessageContainer;
