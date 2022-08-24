import { RouteOptions } from "../types";
import APIRoute from "..";
import RouteDaemonTokenCreate from "./daemon_token_create";
import RouteDaemonFileUpload from "./daemon_file_upload";
import RouteServerCreate from "./server_create";

export enum CustomRouteType {
    DAEMON_TOKEN_CREATE = "DAEMON_TOKEN_CREATE",
    DAEMON_FILE_UPLOAD = "DAEMON_FILE_UPLOAD",
    SERVER_CREATE = "SERVER_CREATE",
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

const routes: Record<CustomRouteType, (options: RouteOptions) => APIRoute> = {
    [CustomRouteType.DAEMON_TOKEN_CREATE]: (options: RouteOptions) => {return new RouteDaemonTokenCreate(options as RouteDaemonTokenCreateOptions);},
    [CustomRouteType.DAEMON_FILE_UPLOAD]: (options: RouteOptions) => {return new RouteDaemonFileUpload(options as RouteDaemonFileUploadOptions);},
    [CustomRouteType.SERVER_CREATE]: (options: RouteOptions) => {return new RouteServerCreate(options as RouteServerCreateOptions);},
}
export default routes;