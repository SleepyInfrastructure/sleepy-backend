/* Types */
import { StateDescriptor, Status } from "../ts/backend/base";
import { DatabaseAddOptions, DatabaseDeleteOptions, DatabaseEditOptions, DatabaseFetchMultipleOptions, DatabaseFetchOptions, DatabaseOptions } from "./types";

/* Local Imports */
import Instance from "../instance";

abstract class Database {
    parent: Instance;
    id: string;
    name: string;
    type: string;
    state: StateDescriptor;

    constructor(parent: Instance, options: DatabaseOptions) {
        this.parent = parent;
        this.id = options.id;
        this.name = options.name;
        this.type = options.type;
        this.state = { status: Status.WAITING, message: "WAITING" };
    }

    abstract start(): Promise<void>;
    abstract fetch<T>(options: DatabaseFetchOptions): Promise<T | null>;
    abstract fetchMultiple<T>(options: DatabaseFetchMultipleOptions): Promise<T[]>;
    abstract add(options: DatabaseAddOptions): Promise<void>;
    abstract edit(options: DatabaseEditOptions): Promise<void>;
    abstract delete(options: DatabaseDeleteOptions): Promise<number>;
}

export default Database;
