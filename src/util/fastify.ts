/* Types */
import { FeatureServerOptions } from "../ts/base";

/* Node Imports */
import { readFileSync } from "fs";
import * as fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifyRateLimit from "@fastify/rate-limit";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastifyWebsocket from "@fastify/websocket";
import fastifyMultipart from "@fastify/multipart";
import { Http2Server, Http2ServerRequest, Http2ServerResponse } from "http2";
import { RouteGenericInterface } from "fastify/types/route";
import { ContentTypeParserDoneFunction } from "fastify/types/content-type-parser";

export type FoxxyFastifyRequest<T extends RouteGenericInterface> = fastify.FastifyRequest<T, Http2Server>;
export type FoxxyFastifyReply = fastify.FastifyReply<Http2Server>;
export type FoxxyFastifyInstance = fastify.FastifyInstance<Http2Server, Http2ServerRequest, Http2ServerResponse, fastify.FastifyBaseLogger, TypeBoxTypeProvider>;
export type FoxxyFastifyPlainInstance = fastify.FastifyInstance;
export type FoxxyFastifyAnyInstance = FoxxyFastifyInstance | FoxxyFastifyPlainInstance;

export function createFastifyInstance(options: FeatureServerOptions): FoxxyFastifyInstance | Error {
    const instance: FoxxyFastifyInstance = fastify.fastify({
        http2: true,
        https: {
            cert: readFileSync(`config/https/${options.https}/fullchain.pem`),
            key: readFileSync(`config/https/${options.https}/privkey.pem`),
            allowHTTP1: true
        },
    }).withTypeProvider<TypeBoxTypeProvider>();
    instance.addContentTypeParser("application/json", { parseAs: "string" }, jsonParser);
    instance.register(fastifyRateLimit, { global : false });
    if(options.cors !== undefined) {
        instance.register(fastifyCors, { origin: options.cors.origins, credentials: true, });
    }
    instance.register(fastifyCookie, {});
    instance.register(fastifyMultipart, {});

    return instance;
};
export function createFastifyPlainInstance(options: FeatureServerOptions, websocket: boolean): FoxxyFastifyPlainInstance | Error {
    const instance: FoxxyFastifyPlainInstance = fastify.fastify({
        https: {
            cert: readFileSync(`config/https/${options.https}/fullchain.pem`),
            key: readFileSync(`config/https/${options.https}/privkey.pem`)
        }
    }).withTypeProvider<TypeBoxTypeProvider>();
    if(options.cors !== undefined) {
        instance.register(fastifyCors, { origin: options.cors.origins, credentials: true, });
    }
    instance.register(fastifyCookie, {});
    if(websocket) {
        instance.register(fastifyWebsocket);
    }

    return instance;
}

function jsonParser(req: FoxxyFastifyRequest<RouteGenericInterface>, body: string, done: ContentTypeParserDoneFunction) {
    try {
        const json = JSON.parse(body.toString());
        done(null, json);
    } catch (e: any) {
        e.statusCode = 400;
        done(e, undefined);
    }
}

export async function startFastifyInstance(instance: FoxxyFastifyAnyInstance, options: FeatureServerOptions): Promise<null> {
    return await new Promise((resolve, reject) => {
        if (instance === undefined) {
            reject(new Error("Instance failed to start!"));
            return;
        }
        instance.listen({ host: "0.0.0.0", port: options.port }, (e) => {
            if (e) {
                reject(e);
                return;
            }
            resolve(null);
        });
    });
};