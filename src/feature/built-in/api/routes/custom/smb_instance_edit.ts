/* Types */
import { DatabaseUnserializedItemValue } from "../../../../../database/types";
import { SMBInstanceEditSchema, SMBInstanceEditSchemaType } from "./_schemas";
import { RequestWithSchema } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaBody } from "../util";

class RouteSMBInstanceEdit extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.post(this.path,
            { config: { rateLimit: { timeWindow: 3000, max: 3 } } },
            async (req: RequestWithSchema<SMBInstanceEditSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaBody(SMBInstanceEditSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Edit (author is checked in selectors) */
                const edit: Record<string, DatabaseUnserializedItemValue> = {};
                if(req.body.name !== undefined) {
                    edit.name = req.body.name;
                }
                if(req.body.recycle !== undefined) {
                    edit.recycle = req.body.recycle ? 1 : 0;
                }
                await feature.database.edit({ destination: "smbinstances", item: edit, selectors: { id: req.body.id, author: session.user }});

                /* Get instance */
                const instance = await feature.database.fetch({ source: "smbinstances", selectors: { id: req.body.id, author: session.user } });
                if(instance === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Send */
                rep.send(instance);
            }
        );
    }
}

export default RouteSMBInstanceEdit;
