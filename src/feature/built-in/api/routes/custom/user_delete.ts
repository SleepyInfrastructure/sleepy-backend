/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseType } from "../../../../../database/types";
import { RouteUserDeleteOptions } from "./index";
import { UserDeleteSchema, UserDeleteSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";
import FeatureDaemon from "../../../../custom/daemon";
import { deleteServer, deleteUptimeEndpoint } from "./_util";

class RouteUserDelete extends APIRoute {
    options: RouteUserDeleteOptions;

    constructor(feature: FeatureAPI, options: RouteUserDeleteOptions) {
        super(feature, options);
        this.options = options;
    }

    async hook(feature: FeatureAPI): Promise<void> {
        if (feature.instance === null) {
            return;
        }
        const database = feature.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }
        const featureDaemon = feature.parent.featureContainer.get("daemon") as FeatureDaemon;
        if (featureDaemon === undefined) {
            this.state = { status: Status.ERROR, message: "NO_FEATURE_DAEMON_FOUND" };
            return;
        }

        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 10000, max: 1 } } },
            async (req: RequestWithSchemaQuery<UserDeleteSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(UserDeleteSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(database, req, rep);
                if(session === null) {
                    return;
                }
                if(session.user !== req.query.id) {
                    rep.code(403); rep.send();
                    return;
                }

                /* Delete user */
                const user = await database.delete({ source: "users", selectors: { id: req.query.id } });
                if(user < 1) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Delete servers */
                const servers = await database.fetchMultiple({ source: "servers", selectors: { author: req.query.id } });
                for(const server of servers) {
                    deleteServer(featureDaemon, database, server.id, session.user);
                }

                /* Delete uptime endpoints */
                const endpoints = await database.fetchMultiple({ source: "uptimeendpoints", selectors: { author: req.query.id } });
                for(const endpoint of endpoints) {
                    deleteUptimeEndpoint(database, endpoint.id, session.user);
                }

                /* Delete rest */
                database.delete({ source: "sessions", selectors: { user: req.query.id } });
                database.delete({ source: "tasks", selectors: { author: req.query.id } });
                database.delete({ source: "userfiles", selectors: { author: req.query.id } });
                // TODO: actually delete user files

                /* Send */
                rep.code(200);  rep.send();
            }
        );
    }
}

export default RouteUserDelete;
