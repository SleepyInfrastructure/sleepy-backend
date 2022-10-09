/* Types */
import { SMBInstanceCreateSchema, SMBInstanceCreateSchemaType } from "ts/common/zod/smb";
import { RequestWithSchema } from "../types";

/* Node Imports */
import { randomBytes } from "crypto";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteSMBInstanceCreate extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<SMBInstanceCreateSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(SMBInstanceCreateSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Check server */
                const server = await feature.database.fetch<Server>({ source: "servers", selectors: { id: req.body.server, author: session.user } })
                if(server === null) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Create instance */
                const smbInstance: SMBInstance = {
                    id: randomBytes(16).toString("hex"),
                    author: session.user,
                    server: req.body.server,
                    name: req.body.name,
                    recycle: req.body.recycle
                };
                feature.database.add({ destination: "smbinstances", item: smbInstance });

                /* Send */
                rep.send(smbInstance);
            }
        );
    }
}

export default RouteSMBInstanceCreate;
