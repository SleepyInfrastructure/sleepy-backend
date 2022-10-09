/* Types */
import { FeatureOptions, StateDescriptor, Status } from "../ts/backend/base";

/* Local Imports */
import Instance from "../instance";

abstract class Feature {
    parent: Instance;
    id: string;
    name: string;
    type: string;
    state: StateDescriptor;

    constructor(parent: Instance, options: FeatureOptions) {
        this.parent = parent;
        this.id = options.id;
        this.name = options.name;
        this.type = options.type;
        this.state = { status: Status.WAITING, message: "WAITING" };
    }

    abstract start(): Promise<void>;
}

export default Feature;
