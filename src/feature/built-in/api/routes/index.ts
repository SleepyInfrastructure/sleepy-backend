/* Types */
import { StateDescriptor, Status } from "../../../../ts/base";
import { RouteOptions } from "./types";

/* Local Imports */
import FeatureAPI from "..";

abstract class APIRoute {
    path: string;
    state: StateDescriptor;

    constructor(feature: FeatureAPI, options: RouteOptions) {
        this.path = options.path;
        this.state = { status: Status.WAITING, message: "WAITING" };
    }

    abstract hook(feature: FeatureAPI): void | Promise<void>;
}

export default APIRoute;
