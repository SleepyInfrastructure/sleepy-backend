import { z } from "zod";
import { IDSchema } from "../types";

export const DaemonTokenCreateSchema = IDSchema;
export type DaemonTokenCreateSchemaType = z.infer<typeof DaemonTokenCreateSchema>;

export const UserDeleteSchema = IDSchema;
export type UserDeleteSchemaType = z.infer<typeof UserDeleteSchema>;

export const NetworkCreateSchema = z.object({
    name: z.string().min(3).max(64),
    ipv4: z.string().min(3).max(256).optional()
});
export type NetworkCreateSchemaType = z.infer<typeof NetworkCreateSchema>;
export const NetworkEditSchema = z.intersection(NetworkCreateSchema, IDSchema);
export type NetworkEditSchemaType = z.infer<typeof NetworkEditSchema>;

export const ServerCreateSchema = z.object({
    name: z.string().min(3).max(64),
    color: z.string().min(6).max(6).optional()
});
export type ServerCreateSchemaType = z.infer<typeof ServerCreateSchema>;
export const ServerEditSchema = z.intersection(z.object({
    name: z.string().min(3).max(64).optional(),
    color: z.string().min(6).max(6).optional()
}), IDSchema);
export type ServerEditSchemaType = z.infer<typeof ServerEditSchema>;
export const ServerDeleteSchema = IDSchema;
export type ServerDeleteSchemaType = z.infer<typeof ServerDeleteSchema>;

export const UptimeEndpointCreateSchema = z.object({
    name: z.string().min(3).max(64),
    host: z.string().min(3).max(256).optional(),
    requestEndpoint: z.string().min(3).max(256).optional()
});
export type UptimeEndpointCreateSchemaType = z.infer<typeof UptimeEndpointCreateSchema>;
export const UptimeEndpointEditSchema = z.intersection(z.object({
    name: z.string().min(3).max(64).optional(),
    host: z.string().min(3).max(256).optional(),
    requestEndpoint: z.string().min(3).max(256).optional()
}), IDSchema);
export type UptimeEndpointEditSchemaType = z.infer<typeof UptimeEndpointEditSchema>;
export const UptimeEndpointDeleteSchema = IDSchema;
export type UptimeEndpointDeleteSchemaType = z.infer<typeof UptimeEndpointDeleteSchema>;

export const DatabaseCreateSchema = z.object({
    server: z.string().min(32).max(32),
    name: z.string().min(3).max(64)
});
export type DatabaseCreateSchemaType = z.infer<typeof DatabaseCreateSchema>;
export const DatabaseEditSchema = z.intersection(z.object({
    server: z.string().min(32).max(32).optional(),
    name: z.string().min(3).max(64).optional()
}), IDSchema);
export type DatabaseEditSchemaType = z.infer<typeof DatabaseEditSchema>;
export const DatabaseDeleteSchema = IDSchema;
export type DatabaseDeleteSchemaType = z.infer<typeof DatabaseDeleteSchema>;

export const SMBInstanceCreateSchema = z.object({
    server: z.string().min(32).max(32),
    name: z.string().min(3).max(64),
    recycle: z.boolean()
});
export type SMBInstanceCreateSchemaType = z.infer<typeof SMBInstanceCreateSchema>;
export const SMBInstanceEditSchema = z.intersection(z.object({
    server: z.string().min(32).max(32).optional(),
    name: z.string().min(3).max(64).optional(),
    recycle: z.boolean().optional()
}), IDSchema);
export type SMBInstanceEditSchemaType = z.infer<typeof SMBInstanceEditSchema>;
export const SMBInstanceDeleteSchema = IDSchema;
export type SMBInstanceDeleteSchemaType = z.infer<typeof SMBInstanceDeleteSchema>;
export const SMBConfigSchema = IDSchema;
export type SMBConfigSchemaType = z.infer<typeof SMBConfigSchema>;

export const SMBShareCreateSchema = z.object({
    parent: z.string().min(32).max(32),
    name: z.string().min(3).max(64),
    path: z.string().min(3).max(1024),
    browsable: z.boolean(),
    readonly: z.boolean(),
    guest: z.boolean(),
    users: z.array(z.string()),
    admins: z.array(z.string())
});
export type SMBShareCreateSchemaType = z.infer<typeof SMBShareCreateSchema>;
export const SMBShareEditSchema = z.intersection(z.object({
    name: z.string().min(3).max(64).optional(),
    path: z.string().min(3).max(1024).optional(),
    browsable: z.boolean().optional(),
    readonly: z.boolean().optional(),
    guest: z.boolean().optional(),
    users: z.array(z.string()).optional(),
    admins: z.array(z.string()).optional()
}), IDSchema);
export type SMBShareEditSchemaType = z.infer<typeof SMBShareEditSchema>;
export const SMBShareDeleteSchema = IDSchema;
export type SMBShareDeleteSchemaType = z.infer<typeof SMBShareDeleteSchema>;

export const SMBUserCreateSchema = z.object({
    parent: z.string().min(32).max(32),
    name: z.string().min(3).max(64)
});
export type SMBUserCreateSchemaType = z.infer<typeof SMBUserCreateSchema>;
export const SMBUserEditSchema = z.intersection(z.object({
    name: z.string().min(3).max(64).optional()
}), IDSchema);
export type SMBUserEditSchemaType = z.infer<typeof SMBUserEditSchema>;
export const SMBUserDeleteSchema = IDSchema;
export type SSMBUserDeleteSchemaType = z.infer<typeof SMBUserDeleteSchema>;

export const TaskDeleteSchema = IDSchema;
export type TaskDeleteSchemaType = z.infer<typeof TaskDeleteSchema>;

export const FileAccessSchema = IDSchema;
export type FileAccessSchemaType = z.infer<typeof FileAccessSchema>;