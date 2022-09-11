/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseDeleteOptions, DatabaseType } from "../../../../../database/types";
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
                    const session = await database.fetch({ source: "sessions", selectors: { "id": req.cookies.Token } });
                    if(session === undefined) { rep.code(403); rep.send(); return; }
                    selectors[this.options.authorField] = session.user;
                }

                const options: DatabaseDeleteOptions = { source: this.options.table, selectors: selectors };
                await database.delete(options);

                rep.code(200);
                rep.send();
            }
        );
    }
}

export default RouteDelete;
