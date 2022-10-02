/* Types */
import { ServerCreateSchema, ServerCreateSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

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
                const serverConfig = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    statsInterval: 60,
                    statsCleanAge: 600,
                    databaseBackupInterval: null
                };
                feature.database.add({ destination: "serverconfigs", item: serverConfig });

                /* Create network */
                const serverNetwork = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    name: `${req.body.name}-network`,
                    ipv4: null
                };
                feature.database.add({ destination: "networks", item: serverNetwork });

                /* Create server */
                const newServer = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    timestamp: Math.round(Date.now() / 1000),
                    network: serverNetwork.id,
                    config: serverConfig.id,
                    name: req.body.name,
                    color: req.body.color ?? "ff3645",
                    netInterfaces: ["eth0"]
                };
                feature.database.add({ destination: "servers", item: newServer });
                
                /* Get server */
                const server = await feature.database.fetch({ source: "servers", selectors: { "id": newServer.id } });
                if(server === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.send(server);
            }
        );
    }
}

export default RouteServerCreate;
