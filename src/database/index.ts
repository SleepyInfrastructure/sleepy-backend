/* Types */
import { StateDescriptor, Status } from "../ts/base";
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
    abstract fetch(options: DatabaseFetchOptions): Promise<any>;
    abstract fetchMultiple(options: DatabaseFetchMultipleOptions): Promise<any[]>;
    abstract add(options: DatabaseAddOptions): Promise<any>;
    abstract edit(options: DatabaseEditOptions): Promise<any>;
    abstract delete(options: DatabaseDeleteOptions): Promise<any>;
}

export default Database;
