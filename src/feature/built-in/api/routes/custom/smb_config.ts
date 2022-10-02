/* Types */
import { SMBConfigSchema, SMBConfigSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";


class RouteSMBConfig extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 1 } } },
            async (req: RequestWithSchema<SMBConfigSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(SMBConfigSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Get instances */
                

                /* Send */
                rep.code(200);
                rep.send();
            }
        );
    }
}

export default RouteSMBConfig;
