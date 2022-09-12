import FeatureDaemon from "..";
import { Connection, DaemonWebsocketMessageType } from "../types";

// Node Imports
import { red, yellow } from "nanocolors";

type DaemonLogItem = {
    daemon: Connection;
    users: Connection[];
};

class DaemonLogManager {
    parent: FeatureDaemon;
    containers: Map<string, DaemonLogItem>;

    constructor(feature: FeatureDaemon) {
        this.parent = feature;
        this.containers = new Map();
    }

    connect(connection: Connection, container: any, daemon: Connection) {
        let logItem = this.containers.get(container.id);
        if(logItem === undefined) {
            logItem = { daemon, users: [] };
            console.log(`${yellow("^")} Connected container logger! (id: ${container.id})`);
            daemon.send({ type: DaemonWebsocketMessageType.DAEMON_CONNECT_CONTAINER_LOG, container: { id: container.id, name: container.names } });
        } else if(logItem.users.some(e => e.client?.id === connection.client?.id)) {
            console.log(`${red("X")} User is already requesting logs from container!`);
            return;
        }

        logItem.users.push(connection);
        this.containers.set(container.id, logItem);
        console.log(`${yellow("^")} Added user to container logs! (user: ${connection.client?.id}, container: ${container.id})`);
    }

    disconnectClient(connection: Connection) {
        if(connection.client === null) {
            return;
        }
        for(const [container, logItem] of this.containers) {
            const user = logItem.users.find(e => e.client?.id === connection.client?.id);
            if(user === undefined) {
                continue;
            }
            
            logItem.users.splice(logItem.users.indexOf(user), 1);
            console.log(`${red("<")} Removed user from container logs! (user: ${connection.client?.id}, container: ${container})`);
            if(logItem.users.length === 0) {
                logItem.daemon.send({ type: DaemonWebsocketMessageType.DAEMON_DISCONNECT_CONTAINER_LOG, container });
                this.containers.delete(container);
                console.log(`${red("<")} Disconnected container logger! (id: ${container}, lack of users)`);
            } else {
                this.containers.set(container, logItem);
            }
        }
    }

    disconnectDaemon(connection: Connection) {
        if(connection.daemon === null) {
            return;
        }
        for(const [container, logItem] of this.containers) {
            if(logItem.daemon.daemon?.id === connection.daemon.id) {
                this.containers.delete(container);
                console.log(`${red("<")} Disconnected container logger! (id: ${container}, daemon disconnected)`);
            }
        }
    }
}
export default DaemonLogManager;