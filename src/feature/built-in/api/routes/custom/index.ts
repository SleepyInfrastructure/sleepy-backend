import { RouteOptions } from "../types";
import APIRoute from "feature/built-in/api/routes";
import FeatureAPI from "feature/built-in/api";
import RouteDaemonTokenCreate from "./daemon_token_create";
import RouteDaemonFileUpload from "./daemon_file_upload";
import RouteServerCreate from "./server_create";
import RouteServerEdit from "./server_edit";
import RouteUserFileAccess from "./user_file_access";
import RouteServerDelete from "./server_delete";
import RouteUptimeEndpointDelete from "./uptime_endpoint_delete";
import RouteDatabaseDelete from "./database_delete";
import RouteUserDelete from "./user_delete";
import RouteTaskDelete from "./task_delete";
import RouteSMBInstanceDelete from "./smb_instance_delete";
import RouteSMBShareDelete from "./smb_share_delete";
import RouteNginxInstanceDelete from "./nginx_instance_delete";
import RouteNginxServerDelete from "./nginx_server_delete";
import RouteServerPublicFetchStructured from "./server_public_fetch_structured";

export enum CustomRouteType {
    DAEMON_TOKEN_CREATE = "DAEMON_TOKEN_CREATE",
    DAEMON_FILE_UPLOAD = "DAEMON_FILE_UPLOAD",
    USER_DELETE = "USER_DELETE",
    SERVER_CREATE = "SERVER_CREATE",
    SERVER_EDIT = "SERVER_EDIT",
    SERVER_DELETE = "SERVER_DELETE",
    UPTIME_ENDPOINT_DELETE = "UPTIME_ENDPOINT_DELETE",
    DATABASE_DELETE = "DATABASE_DELETE",
    SMB_INSTANCE_DELETE = "SMB_INSTANCE_DELETE",
    SMB_SHARE_DELETE = "SMB_SHARE_DELETE",
    NGINX_INSTANCE_DELETE = "NGINX_INSTANCE_DELETE",
    NGINX_SERVER_DELETE = "NGINX_SERVER_DELETE",
    NFS_INSTANCE_DELETE = "NFS_INSTANCE_DELETE",
    NFS_EXPORT_DELETE = "NFS_EXPORT_DELETE",
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
    [CustomRouteType.UPTIME_ENDPOINT_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUptimeEndpointDelete(feature, options);},
    [CustomRouteType.DATABASE_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteDatabaseDelete(feature, options);},
    [CustomRouteType.SMB_INSTANCE_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBInstanceDelete(feature, options);},
    [CustomRouteType.SMB_SHARE_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBShareDelete(feature, options);},
    [CustomRouteType.NGINX_INSTANCE_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteNginxInstanceDelete(feature, options);},
    [CustomRouteType.NGINX_SERVER_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteNginxServerDelete(feature, options);},
    [CustomRouteType.NFS_INSTANCE_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBInstanceDelete(feature, options);},
    [CustomRouteType.NFS_EXPORT_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteSMBShareDelete(feature, options);},
    [CustomRouteType.TASK_DELETE]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteTaskDelete(feature, options);},
    [CustomRouteType.USER_FILE_ACCESS]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteUserFileAccess(feature, options);},
    [CustomRouteType.SERVER_PUBLIC_FETCH_STRUCTURED]: (feature: FeatureAPI, options: RouteOptions) => {return new RouteServerPublicFetchStructured(feature, options);},
}
export default routes;