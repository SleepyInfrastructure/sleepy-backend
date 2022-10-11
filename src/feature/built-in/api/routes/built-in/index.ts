import { RouteOptions } from "../types";
import { APIStructure, APIStructureImported } from "ts/backend/base";
import { DatabaseSort } from "database/types";
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
import FeatureAPI from "../..";

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
    base?: RouteFetchStructuredBaseItemOptions;
};

export type RouteFetchSingleOptions = {
    table: string;
    idField?: string;
    authorField?: string;
    select?: Record<string, string>;
};

export type RouteFetchArrayOptions = RouteFetchSingleOptions & {
    disableIdField?: boolean;
    limit?: number;
    sort?: DatabaseSort;
};

export type RouteFetchStructuredBaseItemOptions = RouteFetchArrayOptions & {
    type: "SINGLE" | "ARRAY";
    structure?: string | APIStructure;
};

export type RouteFetchStructuredItemOptions = RouteFetchStructuredBaseItemOptions & {
    baseIdField?: string;
};

export type RouteFetchStructuredItemImportedOptions = Omit<RouteFetchStructuredItemOptions, "structure"> & {
    structure?: APIStructureImported;
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

const routes: Record<BuiltinRouteType, (feature: FeatureAPI, options: RouteOptions) => APIRoute> = {
    [BuiltinRouteType.FETCH]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteFetch(feature, options as RouteFetchOptions);},
    [BuiltinRouteType.FETCH_MULTIPLE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteFetchMultiple(feature, options as RouteFetchMultipleOptions);},
    [BuiltinRouteType.FETCH_STRUCTURED]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteFetchStructured(feature, options as RouteFetchStructuredOptions);},
    [BuiltinRouteType.DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDelete(feature, options as RouteDeleteOptions);},
    [BuiltinRouteType.SESSION_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSessionCreate(feature, options as RouteSessionCreateOptions);},
    [BuiltinRouteType.SESSION_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSessionDelete(feature, options as RouteSessionDeleteOptions);},
    [BuiltinRouteType.AUTH_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteAuthCreate(feature, options as RouteAuthCreateOptions);},
    [BuiltinRouteType.PUSH_SEND]: (feature: FeatureAPI, options: RouteOptions) => {return new RoutePushSend(feature, options as RoutePushSendOptions);},
    [BuiltinRouteType.PUSH_SUBSCRIBE]: (feature: FeatureAPI, options: RouteOptions) => {return new RoutePushSubscribe(feature, options as RoutePushSubscribeOptions);},
    [BuiltinRouteType.PUSH_UNSUBSCRIBE]: (feature: FeatureAPI, options: RouteOptions) => {return new RoutePushUnsubscribe(feature, options as RoutePushUnsubscribeOptions);},
}
export default routes;