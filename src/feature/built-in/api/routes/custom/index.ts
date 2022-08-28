import { RouteOptions } from "../types";
import APIRoute from "..";
import RouteDaemonTokenCreate from "./daemon_token_create";
import RouteDaemonFileUpload from "./daemon_file_upload";
import RouteServerCreate from "./server_create";
import RouteServerEdit from "./server_edit";
import FeatureAPI from "../..";
import RouteUptimeEndpointCreate from "./uptime_endpoint_create";
import RouteUptimeEndpointEdit from "./uptime_endpoint_edit";

export enum CustomRouteType {
    DAEMON_TOKEN_CREATE = "DAEMON_TOKEN_CREATE",
    DAEMON_FILE_UPLOAD = "DAEMON_FILE_UPLOAD",
    SERVER_CREATE = "SERVER_CREATE",
    SERVER_EDIT = "SERVER_EDIT",
    UPTIME_ENDPOINT_CREATE = "UPTIME_ENDPOINT_CREATE",
    UPTIME_ENDPOINT_EDIT = "UPTIME_ENDPOINT_EDIT"
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

const routes: Record<CustomRouteType, (feature: FeatureAPI, options: RouteOptions) => APIRoute> = {
    [CustomRouteType.DAEMON_TOKEN_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDaemonTokenCreate(feature, options as RouteDaemonTokenCreateOptions);},
    [CustomRouteType.DAEMON_FILE_UPLOAD]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDaemonFileUpload(feature, options as RouteDaemonFileUploadOptions);},
    [CustomRouteType.SERVER_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerCreate(feature, options as RouteServerCreateOptions);},
    [CustomRouteType.SERVER_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerEdit(feature, options as RouteServerEditOptions);},
    [CustomRouteType.UPTIME_ENDPOINT_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUptimeEndpointCreate(feature, options as RouteUptimeEndpointCreateOptions);},
    [CustomRouteType.UPTIME_ENDPOINT_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUptimeEndpointEdit(feature, options as RouteUptimeEndpointEditOptions);},
}
export default routes;