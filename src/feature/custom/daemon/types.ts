/* Types */
import { SocketStream } from "@fastify/websocket";
import FeatureDaemon from ".";
import { FeatureServerOptions } from "feature/types";

/* Options */
export type FeatureDaemonOptions = FeatureServerOptions & {
    version: string;
};

export enum DaemonWebsocketMessageType {
    AUTH_SUCCESS = "AUTH_SUCCESS",
    AUTH_FAILURE = "AUTH_FAILURE",
    
    DAEMON_AUTH = "DAEMON_AUTH",
    DAEMON_AUTH_SUCCESS = "DAEMON_AUTH_SUCCESS",
    DAEMON_AUTH_FAILURE = "DAEMON_AUTH_FAILURE",
    DAEMONS = "DAEMONS",
    DAEMONS_REPLY = "DAEMONS_REPLY",

    DAEMON_CLIENT_REQUEST_RESOURCES = "DAEMON_CLIENT_REQUEST_RESOURCES",
    DAEMON_REQUEST_RESOURCES = "DAEMON_REQUEST_RESOURCES",
    DAEMON_REQUEST_RESOURCES_REPLY = "DAEMON_REQUEST_RESOURCES_REPLY",
    DAEMON_CLIENT_REQUEST_RESOURCES_REPLY = "DAEMON_CLIENT_REQUEST_RESOURCES_REPLY",

    DAEMON_CLIENT_REQUEST_DATABASE_BACKUP = "DAEMON_CLIENT_REQUEST_DATABASE_BACKUP",
    DAEMON_REQUEST_DATABASE_BACKUP = "DAEMON_REQUEST_DATABASE_BACKUP",
    
    DAEMON_REQUEST_STATS = "DAEMON_REQUEST_STATS",
    DAEMON_REQUEST_STATS_REPLY = "DAEMON_REQUEST_STATS_REPLY",
    
    DAEMON_CLIENT_TASK_REPLY = "DAEMON_CLIENT_TASK_REPLY",
    DAEMON_TASK_PROGRESS = "DAEMON_TASK_PROGRESS",
    
    DAEMON_CLIENT_REQUEST_CONTAINER_LOG = "DAEMON_CLIENT_REQUEST_CONTAINER_LOG",
    DAEMON_REQUEST_CONTAINER_LOG = "DAEMON_REQUEST_CONTAINER_LOG",
    DAEMON_CLIENT_CONNECT_CONTAINER_LOG = "DAEMON_CLIENT_CONNECT_CONTAINER_LOG",
    DAEMON_CONNECT_CONTAINER_LOG = "DAEMON_CONNECT_CONTAINER_LOG",
    DAEMON_DISCONNECT_CONTAINER_LOG = "DAEMON_DISCONNECT_CONTAINER_LOG",
    DAEMON_CONTAINER_LOG_MESSAGE = "DAEMON_CONTAINER_LOG_MESSAGE",
    DAEMON_CLIENT_CONTAINER_LOG_MESSAGE = "DAEMON_CLIENT_CONTAINER_LOG_MESSAGE",
    
    DAEMON_CLIENT_REQUEST_CONTAINER_ACTION = "DAEMON_CLIENT_REQUEST_CONTAINER_ACTION",
    DAEMON_REQUEST_CONTAINER_ACTION = "DAEMON_REQUEST_CONTAINER_ACTION",
    
    DAEMON_CLIENT_BUILD_SMB_CONFIG = "DAEMON_CLIENT_BUILD_SMB_CONFIG",
    DAEMON_BUILD_SMB_CONFIG = "DAEMON_BUILD_SMB_CONFIG"
};

export enum DaemonWebsocketAuthFailure {
    WRONG_TOKEN = "WRONG_TOKEN",
    VERSION_MISMATCH = "VERSION_MISMATCH"
};

export enum DaemonFileType {
    BACKUP_DATABASE = "BACKUP_DATABASE",
    CONTAINER_LOG = "CONTAINER_LOG"
};

export class Connection {
    feature: FeatureDaemon;
    daemon: Daemon | null = null;
    client: Client | null = null;
    stream: SocketStream;

    constructor(feature: FeatureDaemon, stream: SocketStream) {
        this.feature = feature;
        this.stream = stream;
    }

    send(message: any) {
        try {
            this.stream.socket.send(JSON.stringify(message));
        } catch(e: any) {
            this.stream.destroy(e);
        }
    }

    disconnect() {
        this.stream.destroy();
    }
};

export class Daemon {
    id: string;
    author: string;

    constructor(id: string, author: string) {
        this.id = id;
        this.author = author;
    }
};

export class Client {
    id: string;

    constructor(id: string) {
        this.id = id;
    }
};
