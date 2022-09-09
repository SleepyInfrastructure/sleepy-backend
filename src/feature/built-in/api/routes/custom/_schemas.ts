import { z } from "zod";
import { IDSchema } from "../types";

export const DaemonTokenCreateSchema = IDSchema;
export type DaemonTokenCreateSchemaType = z.infer<typeof DaemonTokenCreateSchema>;

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