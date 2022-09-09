/* Types */
import { Status } from "../../../ts/base";
import { FeatureAPIOptions } from "./types";

/* Node Imports */
import * as fastify from "fastify";
import { bold, green, yellow } from "nanocolors";

/* Local Imports */
import Feature from "../..";
import Instance from "../../../instance";
import APIRoute from "./routes";
import { createFastifyInstance, startFastifyInstance } from "../../../util/fastify";
import BuiltinRoutes, { BuiltinRouteType } from "./routes/built-in";
import CustomRoutes, { CustomRouteType } from "./routes/custom";

class FeatureAPI extends Feature {
    options: FeatureAPIOptions;
    instance: fastify.FastifyInstance | null;
    routeContainer: Map<string, APIRoute>;

    constructor(parent: Instance, options: FeatureAPIOptions) {
        super(parent, options);
        this.options = options;
        this.instance = null;

        this.routeContainer = new Map();
    }

    async start(): Promise<void> {
        const result = await createFastifyInstance(this.options, false);
        if (result instanceof Error) {
            this.state = { status: Status.ERROR, message: result.message };
            return;
        }
        this.instance = result;

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
        const routePromises: Promise<void>[] = currentRoutes.map(e => e.hook(this));
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
