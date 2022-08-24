/* Types */
import { StateDescriptor, Status } from "../../../../ts/base";
import { RouteOptions } from "./types";

/* Local Imports */
import FeatureAPI from "..";

abstract class APIRoute {
    path: string;
    state: StateDescriptor;

    constructor(options: RouteOptions) {
        this.path = options.path;
        this.state = { status: Status.WAITING, message: "WAITING" };
    }

    abstract hook(feature: FeatureAPI): Promise<void>;
}

export default APIRoute;
