/* Types */
import { Status } from "../../../ts/base";
import { FeatureAPIOptions } from "./types";
import { DatabaseType } from "../../../database/types";

/* Node Imports */
import { bold, green, yellow } from "nanocolors";

/* Local Imports */
import Feature from "../..";
import Instance from "../../../instance";
import APIRoute from "./routes";
import { createFastifyInstance, FoxxyFastifyInstance, startFastifyInstance } from "../../../util/fastify";
import BuiltinRoutes, { BuiltinRouteType } from "./routes/built-in";
import CustomRoutes, { CustomRouteType } from "./routes/custom";
import Database from "../../../database";

class FeatureAPI extends Feature {
    options: FeatureAPIOptions;
    instance: FoxxyFastifyInstance;
    routeContainer: Map<string, APIRoute>;
    database: Database;

    constructor(parent: Instance, options: FeatureAPIOptions) {
        super(parent, options);
        this.options = options;
        this.instance = null as unknown as FoxxyFastifyInstance;
        this.routeContainer = new Map();
        this.database = null as unknown as Database;
    }

    async start(): Promise<void> {
        const instance = await createFastifyInstance(this.options);
        if (instance instanceof Error) {
            this.state = { status: Status.ERROR, message: instance.message };
            return;
        }
        this.instance = instance;
        const database = this.parent.getDatabase(DatabaseType.MYSQL);
        if (database === undefined) {
            this.state = { status: Status.ERROR, message: "NO_DATABASE_FOUND" };
            return;
        }
        this.database = database;

        for (const options of this.options.routes) {
            let route: APIRoute | undefined;
            const builtinType = Object.values(BuiltinRouteType).find(e => e === (options.type as BuiltinRouteType));
            if(builtinType !== undefined) {
                route = BuiltinRoutes[builtinType](this, options);
            } else {
                const customType = Object.values(CustomRouteType).find(e => e === (options.type as CustomRouteType));
                if(customType !== undefined) {
                    route = CustomRoutes[customType](this, options);
                } else {
                    this.state = { status: Status.ERROR, message: `${options.type} is not a valid route type` };
                    return;
                }
            }
            
            this.routeContainer.set(route.path, route);
        }

        const currentRoutes = Array.from(this.routeContainer.values());
        const routePromises: Promise<void>[] = currentRoutes.map(e => Promise.resolve(e.hook(this)));
        await Promise.all(routePromises);
        for (const route of currentRoutes) {
            if (route.state.status !== Status.WAITING) {
                this.state = { status: Status.ERROR, message: `${route.path} - ${route.state.message}` };
                return;
            }
            route.state = { status: Status.SUCCESS, message: "SUCCESS" };
        }
        console.log(`${green(">")} Registered ${yellow(bold(this.options.routes.length))} routes!`);

        startFastifyInstance(this.instance, this.options);
    }
}

export default FeatureAPI;
