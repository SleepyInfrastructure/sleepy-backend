/* Types */
import { Session } from "./types";
import { FoxxyFastifyReply, FoxxyFastifyRequest } from "../../../../util/fastify";

/* Node Imports */
import { z } from "zod";

/* Local Imports */
import Database from "../../../../database";
import { RouteGenericInterface } from "fastify/types/route";

export function validateSchema(schema: z.Schema, data: any, rep: FoxxyFastifyReply): boolean {
    const result = schema.safeParse(data);
    if(!result.success) {
        rep.code(400);
        rep.send({ error: result.error.message });
        return false;
    }

    return true;
}
export function validateSchemaBody(schema: z.Schema, req: FoxxyFastifyRequest<RouteGenericInterface>, rep: FoxxyFastifyReply): boolean {
    return validateSchema(schema, req.body, rep);
}
export function validateSchemaQuery(schema: z.Schema, req: FoxxyFastifyRequest<RouteGenericInterface>, rep: FoxxyFastifyReply): boolean {
    return validateSchema(schema, req.query, rep);
}

export async function getSession(database: Database, req: FoxxyFastifyRequest<RouteGenericInterface>, rep: FoxxyFastifyReply): Promise<Session | null> {
    if(req.cookies.Token === undefined) {
        rep.code(403);
        rep.send();
        return null;
    }
    const session = await database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
    if(session === undefined) {
        rep.code(403);
        rep.send();
        return null;
    }

    return session;
}