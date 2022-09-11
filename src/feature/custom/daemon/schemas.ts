import { z } from "zod";

export const WebsocketMessage = z.object({
    type: z.string(),
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

export const WebsocketDaemonRequestResourcesMessage = z.intersection(WebsocketMessage, z.object({
    memory: z.any().nullable(),
    software: z.any().nullable(),
    disks: z.array(z.any()).nullable(),
    zfsPools: z.array(z.any()).nullable(),
    containers: z.array(z.any()).nullable(),
    containerProjects: z.array(z.any()).nullable()
}));
export type WebsocketDaemonRequestResourcesMessageType = z.infer<typeof WebsocketDaemonRequestResourcesMessage>;

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
    task: z.string(),
    progress: z.number().nonnegative().optional(),
    status: z.enum(["RUNNING", "FAILED", "FINISHED"]).optional()
}));
export type WebsocketDaemonTaskProgressMessageType = z.infer<typeof WebsocketDaemonTaskProgressMessage>;

