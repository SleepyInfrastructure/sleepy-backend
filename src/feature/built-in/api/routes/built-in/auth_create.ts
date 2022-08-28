/* Types */
import { Status } from "../../../../../ts/base";
import { RouteAuthCreateOptions } from "./index";
import { DatabaseFetchOptions, DatabaseType } from "../../../../../database/types";

/* Node Imports */
import { hashSync } from "bcrypt";
import { randomBytes } from "crypto";
import { FastifyRequest, FastifySchema } from "fastify";

/* Local Imports */
import APIRoute from "..";
import FeatureAPI from "../..";

type Request = FastifyRequest<{
    Body: { username: string; password: string };
}>;

const schema: FastifySchema = {
    body: {
        type: "object",
        required: ["username", "password"],
        properties: {
            username: { type: "string", minLength: 3, maxLength: 64 },
            password: { type: "string", minLength: 8, maxLength: 64 }
        }
    }
};

class RouteAuthCreate extends APIRoute {
    options: RouteAuthCreateOptions;

    constructor(feature: FeatureAPI, options: RouteAuthCreateOptions) {
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

        feature.instance.post(this.path,
            { schema: schema, config: { rateLimit: { timeWindow: 10000, max: 1 } } },
            async (req: Request, rep) => {
                /* Check if another user exists under this name */
                const options: DatabaseFetchOptions = { source: "users", selectors: { username: req.body.username } };
                const user = await database.fetch(options);
                if (user !== undefined) {
                    rep.code(403); rep.send();
                    return;
                }

                /* Create user */
                const newUser: any = {
                    id: randomBytes(16).toString("hex"),
                    username: req.body.username,
                    password: hashSync(req.body.password, 10),
                    timestamp: Math.round(Date.now() / 1000)
                };
                database.add({ destination: "users", item: newUser });
                delete newUser.password;
                rep.send(newUser);
            }
        );
    }
}

export default RouteAuthCreate;
