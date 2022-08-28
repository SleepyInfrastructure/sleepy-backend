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

export function createFastifyInstance(options: FeatureServerOptions, websocket: boolean): fastify.FastifyInstance | Error {
    let instance: fastify.FastifyInstance;
    if (options.https) {
        instance = fastify.fastify({
            https: {
                cert: readFileSync(`configs/features/${options.id}/cert.crt`),
                key: readFileSync(`configs/features/${options.id}/key.key`),
            },
        }).withTypeProvider<TypeBoxTypeProvider>();
    } else {
        instance = fastify.fastify({}).withTypeProvider<TypeBoxTypeProvider>();
    }
    if (instance === undefined) {
        return new Error("Instance failed to start!");
    }
    if(options.cors !== undefined) {
        instance.register(fastifyCors, {
            origin: options.cors.origins,
            credentials: true,
        });
    }
    instance.register(fastifyRateLimit, { global : false });
    instance.register(fastifyCookie, {});
    instance.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
        try {
            const json = JSON.parse(body.toString());
            done(null, json);
        } catch (e: any) {
            e.statusCode = 400;
            done(e, undefined);
        }
    });
    if(websocket) {
        instance.register(fastifyWebsocket);
    }
    instance.register(fastifyMultipart, {});

    return instance;
};


export async function startFastifyInstance(instance: fastify.FastifyInstance, options: FeatureServerOptions): Promise<null> {
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

export function pad(n: number) {
    return n < 10 ? `0${n}` : n.toString();
}