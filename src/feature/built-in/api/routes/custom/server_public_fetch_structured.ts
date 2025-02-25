/* Types */
import { IDSchema, IDSchemaType } from "ts/common/zod/base";
import { RequestWithSchemaQuery } from "../types";
/* Local Imports */
import APIRoute from "feature/built-in/api/routes";
import FeatureAPI from "feature/built-in/api";
import { validateSchemaQuery } from "../util";

class RouteServerPublicFetchStructured extends APIRoute {
    hook(feature: FeatureAPI): void {
        feature.instance.get(this.path,
            { config: { rateLimit: { timeWindow: 1000, max: 5 } } },
            async (req: RequestWithSchemaQuery<IDSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(IDSchema, req, rep)) {
                    return;
                }

                /* Get server */
                const serverListing = await feature.database.fetch<PublicServerListing>({ source: "publicserverlistings", selectors: { id: req.query.id } });
                if(serverListing === null) {
                    rep.code(404); rep.send();
                    return;
                }
                const server = await feature.database.fetch<Server>({ source: "servers", selectors: { id: req.query.id } });
                if(server === null) {
                    rep.code(404); rep.send();
                    return;
                }

                /* Create public structured server */
                const publicServerStructured: PublicServerStructured = {
                    id: server.id,
                    author: server.author,
                    name: server.name,
                    memory: server.memory,
                    swap: server.swap,
                    statistics: []
                };
                if(serverListing.statistics) {
                    publicServerStructured.statistics = await feature.database.fetchMultiple<Statistic>({ source: "statistics", selectors: { server: req.query.id, type: "MINUTE" }, sort: { field: "timestamp", order: "DESC" }, limit: 60 });
                }

                /* Send */
                rep.send(publicServerStructured);
            }
        );
    }
}

export default RouteServerPublicFetchStructured;