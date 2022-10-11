import { z } from "zod";
import { BuiltinRouteType } from "./built-in";
import { CustomRouteType } from "./custom";
import { FoxxyFastifyRequest } from "util/fastify";

export type RouteOptions = {
    path: string;
    type: BuiltinRouteType | CustomRouteType;
};

export type Session = {
    id: string;
    user: string;
};

export const IDSchema = z.object({
    id: z.string().min(32).max(32)
});
export type IDSchemaType = z.infer<typeof IDSchema>;

export type RequestWithSchema<T> = FoxxyFastifyRequest<{
    Body: T;
}>;
export type RequestWithSchemaQuery<T> = FoxxyFastifyRequest<{
    Querystring: T;
}>;