/* Types */
import { RouteTaskDeleteOptions } from "./index";
import { TaskDeleteSchema, TaskDeleteSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { getSession, validateSchemaQuery } from "../util";
import { deleteTask } from "./_util";

class RouteTaskDelete extends APIRoute {
    options: RouteTaskDeleteOptions;

    constructor(feature: FeatureAPI, options: RouteTaskDeleteOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 5000, max: 3 } } },
            async (req: RequestWithSchemaQuery<TaskDeleteSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(TaskDeleteSchema, req, rep)) {
                    return;
                }

                /* Get session */
                const session = await getSession(feature.database, req, rep);
                if(session === null) {
                    return;
                }

                /* Delete task */
                const success = await deleteTask(feature.database, req.query.id, session.user);
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

export default RouteTaskDelete;
