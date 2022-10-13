/* Types */
import { Session } from "./types";
import { FoxxyFastifyReply, FoxxyFastifyRequest } from "util/fastify";
/* Node Imports */
import { boolean, z } from "zod";
/* Local Imports */
import Database from "database";
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
        rep.code(403); rep.send();
        return null;
    }
    const session = await database.fetch<Session>({ source: "sessions", selectors: { "id": req.cookies.Token } });
    if(session === null) {
        rep.code(403); rep.send();
        return null;
    }

    return session;
}

export async function checkPrerequisites(database: Database, session: Session, prerequisites: Record<string, string>, body: any, rep: FoxxyFastifyReply): Promise<boolean> {
    const promises: Promise<{ key: string, result: boolean }>[] = [];
    for(const key in prerequisites) {
        const ids: string[] = [body[key]].flat();
        for(const id of ids) {
            promises.push(new Promise(async(resolve) => {
                const item = await database.fetch<any>({ source: prerequisites[key], selectors: { id, author: session.user } })
                resolve({ key, result: item !== null });
            }));
        }
    }
    const failed = (await Promise.all(promises)).filter(e => !e.result);
    if(failed.length > 0) {
        rep.code(400);
        rep.send({ error: `Objects for ${failed.map(e => `"${e.key}"`).join(", ")} not found` });
        return false;
    }

    return true;
}