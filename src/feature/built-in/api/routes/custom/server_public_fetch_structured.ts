/* Types */
import { ServerPublicFetchStructuredSchema, ServerPublicFetchStructuredSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { validateSchemaQuery } from "../util";

class RouteServerPublicFetchStructured extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.get(this.path,
            { config: { rateLimit: { timeWindow: 1000, max: 5 } } },
            async (req: RequestWithSchemaQuery<ServerPublicFetchStructuredSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(ServerPublicFetchStructuredSchema, req, rep)) {
                    return;
                }

                /* Get server */
                const serverListing = await feature.database.fetch({ source: "publicserverlistings", selectors: { id: req.query.id } });
                if(serverListing === undefined) {
                    rep.code(404); rep.send();
                    return;
                }
                const server = await feature.database.fetch({ source: "servers", selectors: { id: req.query.id } });
                if(server === undefined) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Create public structured server */
                const publicServerStructured: any = {
                    id: server.id,
                    author: server.author,
                    name: server.name,
                    memory: server.memory,
                    swap: server.swap,
                    statistics: []
                };
                if(serverListing.statistics) {
                    publicServerStructured.statistics = await feature.database.fetchMultiple({ source: "statistics", selectors: { server: req.query.id, type: "MINUTE" }, sort: { field: "timestamp", order: "DESC" }, limit: 60 });
                }

                /* Send */
                rep.send(publicServerStructured);
            }
        );
    }
}

export default RouteServerPublicFetchStructured;