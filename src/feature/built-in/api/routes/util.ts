/* Types */
import { Session } from "./types";

/* Node Imports */
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

/* Local Imports */
import Database from "../../../../database";

export function validateSchema(schema: z.Schema, data: any, rep: FastifyReply): boolean {
    const result = schema.safeParse(data);
    if(!result.success) {
        rep.code(400);
        rep.send({ error: result.error.message });
        return false;
    }

    return true;
}
export function validateSchemaBody(schema: z.Schema, req: FastifyRequest, rep: FastifyReply): boolean {
    return validateSchema(schema, req.body, rep);
}
export function validateSchemaQuery(schema: z.Schema, req: FastifyRequest, rep: FastifyReply): boolean {
    return validateSchema(schema, req.query, rep);
}

export async function getSession(database: Database, req: FastifyRequest, rep: FastifyReply): Promise<Session | null> {
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