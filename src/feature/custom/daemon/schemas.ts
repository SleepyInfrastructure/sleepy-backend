/* Types */
import { DaemonWebsocketMessageType, TaskStatus } from "./types";
/* Node Imports */
import { z } from "zod";

export const WebsocketMessage = z.object({
    type: z.nativeEnum(DaemonWebsocketMessageType),
});
export type WebsocketMessageType = z.infer<typeof WebsocketMessage>;

export const WebsocketDaemonAuthMessage = z.intersection(WebsocketMessage, z.object({
    version: z.string(),
    token: z.string().max(32),
    databases: z.array(z.string())
}));
export type WebsocketDaemonAuthMessageType = z.infer<typeof WebsocketDaemonAuthMessage>;

export const WebsocketDaemonClientRequestResourcesMessage = z.intersection(WebsocketMessage, z.object({
    id: z.string().max(32),
    resources: z.array(z.string())
}));
export type WebsocketDaemonClientRequestResourcesMessageType = z.infer<typeof WebsocketDaemonClientRequestResourcesMessage>;

export const WebsocketDaemonRequestResourcesReplyMessage = z.intersection(WebsocketMessage, z.object({
    memory: z.any().nullable(),
    software: z.any().nullable(),
    disks: z.array(z.any()).nullable(),
    zfsPools: z.array(z.any()).nullable(),
    containers: z.array(z.any()).nullable(),
    containerProjects: z.array(z.any()).nullable()
}));
export type WebsocketDaemonRequestResourcesReplyMessageType = z.infer<typeof WebsocketDaemonRequestResourcesReplyMessage>;

export const WebsocketDaemonClientRequestDatabaseBackupMessage = z.intersection(WebsocketMessage, z.object({
    id: z.string().max(32),
    database: z.string(),
    data: z.boolean()
}));
export type WebsocketDaemonClientRequestDatabaseBackupMessageType = z.infer<typeof WebsocketDaemonClientRequestDatabaseBackupMessage>;

export const WebsocketDaemonRequestDatabaseBackupReplyMessage = z.intersection(WebsocketMessage, z.object({
    id: z.string().max(32),
    task: z.string()
}));
export type WebsocketDaemonRequestDatabaseBackupReplyMessageType = z.infer<typeof WebsocketDaemonRequestDatabaseBackupReplyMessage>;

export const WebsocketDaemonRequestStatsReplyMessage = z.intersection(WebsocketMessage, z.object({
    cpu: z.any(),
    memory: z.any(),
    network: z.any(),
    disks: z.array(z.any()),
    containers: z.array(z.any()),
}));
export type WebsocketDaemonRequestStatsReplyMessageType = z.infer<typeof WebsocketDaemonRequestStatsReplyMessage>;

export const WebsocketDaemonTaskProgressMessage = z.intersection(WebsocketMessage, z.object({
    id: z.string(),
    progress: z.number().nonnegative().optional(),
    status: z.nativeEnum(TaskStatus).optional()
}));
export type WebsocketDaemonTaskProgressMessageType = z.infer<typeof WebsocketDaemonTaskProgressMessage>;

export const WebsocketDaemonClientRequestContainerLogMessage = z.intersection(WebsocketMessage, z.object({
    id: z.string()
}));
export type WebsocketDaemonClientRequestContainerLogMessageType = z.infer<typeof WebsocketDaemonClientRequestContainerLogMessage>;

export const WebsocketDaemonClientConnectContainerLogMessage = z.intersection(WebsocketMessage, z.object({
    id: z.string(),
    project: z.boolean()
}));
export type WebsocketDaemonClientConnectContainerLogMessageType = z.infer<typeof WebsocketDaemonClientConnectContainerLogMessage>;

export const WebsocketDaemonContainerLogMessageMessage = z.intersection(WebsocketMessage, z.object({
    id: z.string(),
    message: z.string()
}));
export type WebsocketDaemonContainerLogMessageMessageType = z.infer<typeof WebsocketDaemonContainerLogMessageMessage>;

