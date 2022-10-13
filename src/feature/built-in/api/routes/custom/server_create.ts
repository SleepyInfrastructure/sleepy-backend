/* Types */
import { ServerCreateSchema, ServerCreateSchemaType } from "ts/common/zod/server";
import { RequestWithSchema } from "feature/built-in/api/routes/types";
/* Node Imports */
import { randomBytes } from "crypto";
/* Local Imports */
import APIRoute from "feature/built-in/api/routes";
import FeatureAPI from "feature/built-in/api";
import { getSession, validateSchemaBody } from "feature/built-in/api/routes/util"

class RouteServerCreate extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<ServerCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(ServerCreateSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Create config */
                const config: ServerConfig = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    statsInterval: 60,
                    statsCleanAge: 600,
                    databaseBackupInterval: null
                };
                feature.database.add({ destination: "serverconfigs", item: config });

                /* Create network */
                const network: Network = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    name: `${req.body.name}-network`,
                    ipv4: null
                };
                feature.database.add({ destination: "networks", item: network });

                /* Create server */
                const server: Server = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    timestamp: Math.round(Date.now() / 1000),
                    network: network.id,
                    config: config.id,
                    name: req.body.name,
                    color: req.body.color ?? "ff3645",
                    memory: 0,
                    swap: 0,
                    netInterfaces: ["eth0"]
                };
                feature.database.add({ destination: "servers", item: server });

                /* Send */
                rep.send(server);
            }
        );
    }
}

export default RouteServerCreate;
