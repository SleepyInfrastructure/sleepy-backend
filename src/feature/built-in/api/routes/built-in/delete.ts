/* Types */
import { DatabaseDeleteOptions } from "../../../../../database/types";
import { RouteDeleteOptions } from "./index";
import { DeleteSchema, DeleteSchemaType } from "./_schemas";
import { RequestWithSchemaQuery } from "../types";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";
import { validateSchemaQuery } from "../util";

class RouteDelete extends APIRoute {
    options: RouteDeleteOptions;

    constructor(feature: FeatureAPI, options: RouteDeleteOptions) {
        super(feature, options);
        this.options = options;
    }

    hook(feature: FeatureAPI): void {
        feature.instance.delete(this.path,
            { config: { rateLimit: { timeWindow: 1000, max: 10 } } },
            async (req: RequestWithSchemaQuery<DeleteSchemaType>, rep) => {
                /* Validate schemas */
                if(!validateSchemaQuery(DeleteSchema, req, rep)) {
                    return;
                }

                /* Delete */
                const selectors: any = { [this.options.idField === undefined ? "id": this.options.idField]: req.query.id };
                if(this.options.authorField !== undefined) {
                    if(req.cookies.Token === undefined) { rep.code(403); rep.send(); return; }
                    const session = await feature.database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
                    if(session === undefined) { rep.code(403); rep.send(); return; }
                    selectors[this.options.authorField] = session.user;
                }

                const options: DatabaseDeleteOptions = { source: this.options.table, selectors: selectors };
                await feature.database.delete(options);

                rep.code(200);
                rep.send();
            }
        );
    }
}

export default RouteDelete;
