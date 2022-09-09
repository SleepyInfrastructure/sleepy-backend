import { RouteOptions } from "../types";
import APIRoute from "..";
import RouteDaemonTokenCreate from "./daemon_token_create";
import RouteDaemonFileUpload from "./daemon_file_upload";
import RouteServerCreate from "./server_create";
import RouteServerEdit from "./server_edit";
import FeatureAPI from "../..";
import RouteUptimeEndpointCreate from "./uptime_endpoint_create";
import RouteUptimeEndpointEdit from "./uptime_endpoint_edit";
import RouteNetworkCreate from "./network_create";
import RouteNetworkEdit from "./network_edit";
import RouteDatabaseCreate from "./database_create";
import RouteDatabaseEdit from "./database_edit";

export enum CustomRouteType {
    DAEMON_TOKEN_CREATE = "DAEMON_TOKEN_CREATE",
    DAEMON_FILE_UPLOAD = "DAEMON_FILE_UPLOAD",
    SERVER_CREATE = "SERVER_CREATE",
    SERVER_EDIT = "SERVER_EDIT",
    UPTIME_ENDPOINT_CREATE = "UPTIME_ENDPOINT_CREATE",
    UPTIME_ENDPOINT_EDIT = "UPTIME_ENDPOINT_EDIT",
    NETWORK_CREATE = "NETWORK_CREATE",
    NETWORK_EDIT = "NETWORK_EDIT",
    DATABASE_CREATE = "DATABASE_CREATE",
    DATABASE_EDIT = "DATABASE_EDIT",
};

export type RouteDaemonTokenCreateOptions = RouteOptions & {
    type: CustomRouteType.DAEMON_TOKEN_CREATE;
};
export type RouteDaemonFileUploadOptions = RouteOptions & {
    type: CustomRouteType.DAEMON_FILE_UPLOAD;
};

export type RouteServerCreateOptions = RouteOptions & {
    type: CustomRouteType.SERVER_CREATE;
};
export type RouteServerEditOptions = RouteOptions & {
    type: CustomRouteType.SERVER_EDIT;
};

export type RouteUptimeEndpointCreateOptions = RouteOptions & {
    type: CustomRouteType.UPTIME_ENDPOINT_CREATE;
};
export type RouteUptimeEndpointEditOptions = RouteOptions & {
    type: CustomRouteType.UPTIME_ENDPOINT_EDIT;
};

export type RouteNetworkCreateOptions = RouteOptions & {
    type: CustomRouteType.NETWORK_CREATE;
};
export type RouteNetworkEditOptions = RouteOptions & {
    type: CustomRouteType.NETWORK_EDIT;
};

export type RouteDatabaseCreateOptions = RouteOptions & {
    type: CustomRouteType.DATABASE_CREATE;
};
export type RouteDatabaseEditOptions = RouteOptions & {
    type: CustomRouteType.DATABASE_EDIT;
};

const routes: Record<CustomRouteType, (feature: FeatureAPI, options: RouteOptions) => APIRoute> = {
    [CustomRouteType.DAEMON_TOKEN_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDaemonTokenCreate(feature, options as RouteDaemonTokenCreateOptions);},
    [CustomRouteType.DAEMON_FILE_UPLOAD]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDaemonFileUpload(feature, options as RouteDaemonFileUploadOptions);},
    [CustomRouteType.SERVER_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerCreate(feature, options as RouteServerCreateOptions);},
    [CustomRouteType.SERVER_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerEdit(feature, options as RouteServerEditOptions);},
    [CustomRouteType.UPTIME_ENDPOINT_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUptimeEndpointCreate(feature, options as RouteUptimeEndpointCreateOptions);},
    [CustomRouteType.UPTIME_ENDPOINT_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUptimeEndpointEdit(feature, options as RouteUptimeEndpointEditOptions);},
    [CustomRouteType.NETWORK_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteNetworkCreate(feature, options as RouteNetworkCreateOptions);},
    [CustomRouteType.NETWORK_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteNetworkEdit(feature, options as RouteNetworkEditOptions);},
    [CustomRouteType.DATABASE_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDatabaseCreate(feature, options as RouteDatabaseCreateOptions);},
    [CustomRouteType.DATABASE_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDatabaseEdit(feature, options as RouteDatabaseEditOptions);},
}
export default routes;