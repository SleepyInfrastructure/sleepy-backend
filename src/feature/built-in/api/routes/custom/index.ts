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
import RouteUserFileAccess from "./user_file_access";
import RouteServerDelete from "./server_delete";
import RouteUptimeEndpointDelete from "./uptime_endpoint_delete";
import RouteDatabaseDelete from "./database_delete";
import RouteUserDelete from "./user_delete";
import RouteTaskDelete from "./task_delete";
import RouteSMBInstanceCreate from "./smb_instance_create";
import RouteSMBInstanceEdit from "./smb_instance_edit";
import RouteSMBInstanceDelete from "./smb_instance_delete";
import RouteSMBShareCreate from "./smb_share_create";
import RouteSMBShareEdit from "./smb_share_edit";
import RouteSMBShareDelete from "./smb_share_delete";
import RouteSMBUserCreate from "./smb_user_create";
import RouteSMBUserEdit from "./smb_user_edit";
import RouteServerPublicFetchStructured from "./server_public_fetch_structured";

export enum CustomRouteType {
    DAEMON_TOKEN_CREATE = "DAEMON_TOKEN_CREATE",
    DAEMON_FILE_UPLOAD = "DAEMON_FILE_UPLOAD",
    USER_DELETE = "USER_DELETE",
    SERVER_CREATE = "SERVER_CREATE",
    SERVER_EDIT = "SERVER_EDIT",
    SERVER_DELETE = "SERVER_DELETE",
    UPTIME_ENDPOINT_CREATE = "UPTIME_ENDPOINT_CREATE",
    UPTIME_ENDPOINT_EDIT = "UPTIME_ENDPOINT_EDIT",
    UPTIME_ENDPOINT_DELETE = "UPTIME_ENDPOINT_DELETE",
    NETWORK_CREATE = "NETWORK_CREATE",
    NETWORK_EDIT = "NETWORK_EDIT",
    DATABASE_CREATE = "DATABASE_CREATE",
    DATABASE_EDIT = "DATABASE_EDIT",
    DATABASE_DELETE = "DATABASE_DELETE",
    SMB_INSTANCE_CREATE = "SMB_INSTANCE_CREATE",
    SMB_INSTANCE_EDIT = "SMB_INSTANCE_EDIT",
    SMB_INSTANCE_DELETE = "SMB_INSTANCE_DELETE",
    SMB_SHARE_CREATE = "SMB_SHARE_CREATE",
    SMB_SHARE_EDIT = "SMB_SHARE_EDIT",
    SMB_SHARE_DELETE = "SMB_SHARE_DELETE",
    SMB_USER_CREATE = "SMB_USER_CREATE",
    SMB_USER_EDIT = "SMB_USER_EDIT",
    TASK_DELETE = "TASK_DELETE",
    USER_FILE_ACCESS = "USER_FILE_ACCESS",
    SERVER_PUBLIC_FETCH_STRUCTURED = "SERVER_PUBLIC_FETCH_STRUCTURED",
};

export type RouteDaemonFileUploadOptions = RouteOptions & {
    root: string;
};
export type RouteUserFileAccessOptions = RouteOptions & {
    root: string;
};

const routes: Record<CustomRouteType, (feature: FeatureAPI, options: RouteOptions) => APIRoute> = {
    [CustomRouteType.DAEMON_TOKEN_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDaemonTokenCreate(feature, options);},
    [CustomRouteType.DAEMON_FILE_UPLOAD]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDaemonFileUpload(feature, options);},
    [CustomRouteType.USER_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUserDelete(feature, options);},
    [CustomRouteType.SERVER_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerCreate(feature, options);},
    [CustomRouteType.SERVER_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerEdit(feature, options);},
    [CustomRouteType.SERVER_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerDelete(feature, options);},
    [CustomRouteType.UPTIME_ENDPOINT_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUptimeEndpointCreate(feature, options);},
    [CustomRouteType.UPTIME_ENDPOINT_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUptimeEndpointEdit(feature, options);},
    [CustomRouteType.UPTIME_ENDPOINT_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUptimeEndpointDelete(feature, options);},
    [CustomRouteType.NETWORK_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteNetworkCreate(feature, options);},
    [CustomRouteType.NETWORK_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteNetworkEdit(feature, options);},
    [CustomRouteType.DATABASE_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDatabaseCreate(feature, options);},
    [CustomRouteType.DATABASE_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDatabaseEdit(feature, options);},
    [CustomRouteType.DATABASE_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDatabaseDelete(feature, options);},
    [CustomRouteType.SMB_INSTANCE_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBInstanceCreate(feature, options);},
    [CustomRouteType.SMB_INSTANCE_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBInstanceEdit(feature, options);},
    [CustomRouteType.SMB_INSTANCE_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBInstanceDelete(feature, options);},
    [CustomRouteType.SMB_SHARE_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBShareCreate(feature, options);},
    [CustomRouteType.SMB_SHARE_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBShareEdit(feature, options);},
    [CustomRouteType.SMB_SHARE_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBShareDelete(feature, options);},
    [CustomRouteType.SMB_USER_CREATE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBUserCreate(feature, options);},
    [CustomRouteType.SMB_USER_EDIT]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBUserEdit(feature, options);},
    [CustomRouteType.TASK_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteTaskDelete(feature, options);},
    [CustomRouteType.USER_FILE_ACCESS]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUserFileAccess(feature, options);},
    [CustomRouteType.SERVER_PUBLIC_FETCH_STRUCTURED]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerPublicFetchStructured(feature, options);},
}
export default routes;