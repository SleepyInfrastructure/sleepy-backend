/* Types */
import { IDSchema, IDSchemaType } from "ts/common/zod/base";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";
import { deleteSmbInstance } from "./_util";

class RouteSMBInstanceDelete extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 3 } } },
            async (req: RequestWithSchemaQuery<IDSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(IDSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Delete instance */
                const success = await deleteSmbInstance(feature.database, req.query.id, session.user);
                if(!success) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.code(200); rep.send();
            }
        );
    }
}

export default RouteSMBInstanceDelete;
