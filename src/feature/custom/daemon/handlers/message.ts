import { z } from "zod";
import FeatureDaemon from "..";
import { Client, Connection, Daemon, DaemonWebsocketMessageType } from "../types";
import { validate } from "../util";

abstract class WebsocketMessageHandler<T> {
    parent: FeatureDaemon;
    types: DaemonWebsocketMessageType[];
    schema: z.Schema;
    constructor(parent: FeatureDaemon, types: DaemonWebsocketMessageType[], schema: z.Schema) {
        this.parent = parent;
        this.types = types;
        this.schema = schema;
    }

    validate(message: any): (T | null) {
        const detailedMessage = validate<T>(this.schema, message);
        if(detailedMessage === null) {
            return null;
        }

        return detailedMessage;
    }

    handle?(connection: Connection, message: T): void;
    handleClient?(connection: Connection, message: T, client: Client): void;
    handleDaemon?(connection: Connection, message: T, daemon: Daemon): void;
}
export default WebsocketMessageHandler;