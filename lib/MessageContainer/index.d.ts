import React from 'react';
import { IMessage } from '../types';
import { MessageContainerProps } from './types';
export * from './types';
export interface RenderCellType {
    children?: Children;
    index?: number;
    onLayout?: any[];
    style?: Style;
}
export interface Children {
}
export interface Style {
    alignItems?: string;
    flexDirection?: string;
    left?: number;
    position?: string;
    top?: number;
    transform?: Array<Children[]>;
    width?: number;
}
declare function MessageContainer<TMessage extends IMessage = IMessage>(props: MessageContainerProps<TMessage>): React.JSX.Element;
export default MessageContainer;
