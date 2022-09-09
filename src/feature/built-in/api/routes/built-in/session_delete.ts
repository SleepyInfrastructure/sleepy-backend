/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseFetchOptions, DatabaseType } from "../../../../../database/types";
import { RouteSessionDeleteOptions } from "./index";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

class RouteSessionDelete extends APIRoute {
    options: RouteSessionDeleteOptions;

    constructor(feature: FeatureAPI, options: RouteSessionDeleteOptions) {
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

        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 1000, max: 4 } } },
            async (req, rep) => {
                /* If there is no token, it's already done */
                if(req.cookies.Token === undefined) { rep.code(200); rep.send(); return; }

                /* Clear session */
                const token = req.cookies.Token;
                rep.clearCookie("Token", { path: "/" });

                /* Get session */
                const options: DatabaseFetchOptions = { source: "sessions", selectors: { id: token } };
                const session = await database.fetch(options);
                if (session === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Delete session */
                await database.delete(options);
                rep.code(200); rep.send();
            }
        );
    }
}

export default RouteSessionDelete;
