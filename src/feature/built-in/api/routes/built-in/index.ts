import { RouteOptions } from "../types";
import { DatabaseSort } from "../../../../../ts/base";
import APIRoute from "..";
import RouteFetch from "./fetch";
import RouteFetchMultiple from "./fetch_multiple";
import RouteFetchStructured from "./fetch_structured";
import RouteDelete from "./delete";
import RouteSessionCreate from "./session_create";
import RouteSessionDelete from "./session_delete";
import RouteAuthCreate from "./auth_create";
import RoutePushSend from "./push_send";
import RoutePushSubscribe from "./push_subscribe";
import RoutePushUnsubscribe from "./push_unsubscribe";

export enum BuiltinRouteType {
    FETCH = "FETCH",
    FETCH_MULTIPLE = "FETCH_MULTIPLE",
    FETCH_STRUCTURED = "FETCH_STRUCTURED",
    DELETE = "DELETE",
    SESSION_CREATE = "SESSION_CREATE",
    SESSION_DELETE = "SESSION_DELETE",
    AUTH_CREATE = "AUTH_CREATE",
    PUSH_SEND = "PUSH_SEND",
    PUSH_SUBSCRIBE = "PUSH_SUBSCRIBE",
    PUSH_UNSUBSCRIBE = "PUSH_UNSUBSCRIBE"
};

export type RouteFetchOptions = RouteOptions & RouteFetchSingleOptions & {
    type: BuiltinRouteType.FETCH;
};

export type RouteFetchMultipleOptions = RouteOptions & RouteFetchArrayOptions & {
    type: BuiltinRouteType.FETCH_MULTIPLE;
};

export type RouteFetchStructuredOptions = RouteOptions & {
    type: BuiltinRouteType.FETCH_STRUCTURED;
    base?: RouteFetchArrayOptions& { type: "SINGLE" | "ARRAY" };
    structure: Record<string, RouteFetchStructuredItemOptions & { type: "SINGLE" | "ARRAY" }>;
};

export type RouteFetchSingleOptions = {
    table: string;
    idField?: string;
    authorField?: string;
};

export type RouteFetchArrayOptions = RouteFetchSingleOptions & {
    disableIdField?: boolean;
    limit?: number;
    sort?: DatabaseSort;
};

export type RouteFetchStructuredItemOptions = RouteFetchArrayOptions & {
    baseIdField?: string;
};

export type RouteDeleteOptions = RouteOptions & {
    type: BuiltinRouteType.DELETE;

    table: string;
    idField?: string;
    authorField?: string;
};

export type RouteSessionCreateOptions = RouteOptions & {
    type: BuiltinRouteType.SESSION_CREATE;
};

export type RouteSessionDeleteOptions = RouteOptions & {
    type: BuiltinRouteType.SESSION_DELETE;
};

export type RouteAuthCreateOptions = RouteOptions & {
    type: BuiltinRouteType.AUTH_CREATE;
};

export type RoutePushSendOptions = RouteOptions & {
    type: BuiltinRouteType.PUSH_SEND;
};

export type RoutePushSubscribeOptions = RouteOptions & {
    type: BuiltinRouteType.PUSH_SUBSCRIBE;
};

export type RoutePushUnsubscribeOptions = RouteOptions & {
    type: BuiltinRouteType.PUSH_UNSUBSCRIBE;
};

const routes: Record<BuiltinRouteType, (options: RouteOptions) => APIRoute> = {
    [BuiltinRouteType.FETCH]: (options: RouteOptions) => {return new RouteFetch(options as RouteFetchOptions);},
    [BuiltinRouteType.FETCH_MULTIPLE]: (options: RouteOptions) => {return new RouteFetchMultiple(options as RouteFetchMultipleOptions);},
    [BuiltinRouteType.FETCH_STRUCTURED]: (options: RouteOptions) => {return new RouteFetchStructured(options as RouteFetchStructuredOptions);},
    [BuiltinRouteType.DELETE]: (options: RouteOptions) => {return new RouteDelete(options as RouteDeleteOptions);},
    [BuiltinRouteType.SESSION_CREATE]: (options: RouteOptions) => {return new RouteSessionCreate(options as RouteSessionCreateOptions);},
    [BuiltinRouteType.SESSION_DELETE]: (options: RouteOptions) => {return new RouteSessionDelete(options as RouteSessionDeleteOptions);},
    [BuiltinRouteType.AUTH_CREATE]: (options: RouteOptions) => {return new RouteAuthCreate(options as RouteAuthCreateOptions);},
    [BuiltinRouteType.PUSH_SEND]: (options: RouteOptions) => {return new RoutePushSend(options as RoutePushSendOptions);},
    [BuiltinRouteType.PUSH_SUBSCRIBE]: (options: RouteOptions) => {return new RoutePushSubscribe(options as RoutePushSubscribeOptions);},
    [BuiltinRouteType.PUSH_UNSUBSCRIBE]: (options: RouteOptions) => {return new RoutePushUnsubscribe(options as RoutePushUnsubscribeOptions);},
}
export default routes;