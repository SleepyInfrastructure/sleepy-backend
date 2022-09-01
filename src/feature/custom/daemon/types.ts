/* Types */
import { SocketStream } from "@fastify/websocket";
import { FastifyRequest } from "fastify";
import FeatureDaemon from ".";
import { FeatureServerOptions, FeatureType } from "../../../ts/base";

/* Options */
export type FeatureDaemonOptions = FeatureServerOptions & {
    type: FeatureType.DAEMON;
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
    
    DAEMON_REQUEST_LIVE_STATS = "DAEMON_REQUEST_LIVE_STATS",
    DAEMON_REQUEST_LIVE_STATS_REPLY = "DAEMON_REQUEST_LIVE_STATS_REPLY",
    DAEMON_CLIENT_REQUEST_LIVE_STATS_REPLY = "DAEMON_CLIENT_REQUEST_LIVE_STATS_REPLY",
};

export enum DaemonWebsocketAuthFailure {
    WRONG_TOKEN = "WRONG_TOKEN",
    VERSION_MISMATCH = "VERSION_MISMATCH"
};

export enum DaemonFileUploadType {
    BACKUP_DATABASE = "BACKUP_DATABASE"
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
};

export class Daemon {
    connection: Connection;
    id: string;
    author: string;

    constructor(connection: Connection, id: string, author: string) {
        this.connection = connection;
        this.id = id;
        this.author = author;
    }

    send(message: any) {
        try {
            this.connection.stream.socket.send(JSON.stringify(message));
        } catch(e: any) {
            this.connection.stream.destroy(e);
        }
    }
};

export class Client {
    connection: Connection;
    id: string;

    constructor(connection: Connection, id: string) {
        this.connection = connection;
        this.id = id;
    }

    send(message: any) {
        try {
            this.connection.stream.socket.send(JSON.stringify(message));
        } catch(e: any) {
            this.connection.stream.destroy(e);
        }
    }
};
