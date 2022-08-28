/* Types */
import { Status } from "../../../../../ts/base";
import { DatabaseDeleteOptions, DatabaseType } from "../../../../../database/types";
import { RouteDeleteOptions } from "./index";

/* Node Imports */
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { id: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["id"],
        properties: {
            id: { type: "string", minLength: 32, maxLength: 32 }
        }
    }
};

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
            { schema: schema, config: { rateLimit: { timeWindow: 1000, max: 10 } } },
            async (req: Request, rep) => {
                /* Delete */
                const selectors: any = { [this.options.idField === undefined ? "id": this.options.idField]: req.body.id };
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
