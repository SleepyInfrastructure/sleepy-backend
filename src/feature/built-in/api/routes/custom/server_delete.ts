/* Types */
import { Status } from "../../../../../ts/base";
import { ServerDeleteSchema, ServerDeleteSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";
import FeatureDaemon from "../../../../custom/daemon";
import { deleteServer } from "./_util";

class RouteServerDelete extends APIRoute {
    hook(feature: FeatureAPI): void {
        const featureDaemon = feature.parent.featureContainer.get("daemon") as FeatureDaemon;
        if (featureDaemon === undefined) {
            this.state = { status: Status.ERROR, message: "NO_FEATURE_DAEMON_FOUND" };
            return;
        }

        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 10000, max: 3 } } },
            async (req: RequestWithSchemaQuery<ServerDeleteSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(ServerDeleteSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Delete server */
                const success = await deleteServer(featureDaemon, feature.database, req.query.id, session.user);
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

export default RouteServerDelete;
