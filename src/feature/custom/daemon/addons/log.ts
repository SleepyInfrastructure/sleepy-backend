/* Types */
import FeatureDaemon from "..";
import FeatureDaemonAddon, { FeatureDaemonAddonType } from "./addon";
import { Client, Connection, Daemon, DaemonWebsocketMessageType } from "../types";

/* Node Imports */
import { red, yellow } from "nanocolors";

type DaemonLogItem = {
    daemon: Connection;
    users: Connection[];
};

class DaemonLogManager extends FeatureDaemonAddon {
    containers: Map<string, DaemonLogItem>;

    constructor(feature: FeatureDaemon) {
        super(FeatureDaemonAddonType.DAEMON_LOG_MANAGER, feature);
        this.containers = new Map();
    }

    disconnect(connection: Connection): void {
        if(connection.client !== null) {
            this.disconnectClient(connection.client);
        } else if(connection.daemon !== null) {
            this.disconnectDaemon(connection.daemon);
        }
    }

    connectClient(connection: Connection, client: Client, daemon: Connection, container: Container | ContainerProject, options: ContainerConnectLogOptions) {
        let logItem = this.containers.get(container.id);
        if(logItem === undefined) {
            logItem = { daemon, users: [] };
            console.log(`${yellow("^")} Connected container logger! (id: ${container.id})`);

            const message: any = { type: DaemonWebsocketMessageType.DAEMON_CONNECT_CONTAINER_LOG, options };
            if(options.project === true) {
                message.container = { id: container.id, name: container.name, path: (container as ContainerProject).path };
            } else {
                message.container = { id: container.id, name: container.name };
            }
            daemon.send(message);
        } else if(logItem.users.some(e => e.client?.id === client.id)) {
            console.log(`${red("X")} User is already requesting logs from container!`);
            return;
        }

        logItem.users.push(connection);
        this.containers.set(container.id, logItem);
        console.log(`${yellow("^")} Added user to container logs! (user: ${client.id}, container: ${container.id})`);
    }

    disconnectClient(client: Client) {
        for(const [container, logItem] of this.containers) {
            const user = logItem.users.find(e => e.client?.id === client.id);
            if(user === undefined) {
                continue;
            }
            
            logItem.users.splice(logItem.users.indexOf(user), 1);
            console.log(`${red("<")} Removed user from container logs! (user: ${client.id}, container: ${container})`);
            if(logItem.users.length === 0) {
                logItem.daemon.send({ type: DaemonWebsocketMessageType.DAEMON_DISCONNECT_CONTAINER_LOG, id: container });
                this.containers.delete(container);
                console.log(`${red("<")} Disconnected container logger! (id: ${container}, lack of users)`);
            } else {
                this.containers.set(container, logItem);
            }
        }
    }

    disconnectDaemon(daemon: Daemon) {
        for(const [container, logItem] of this.containers) {
            if(logItem.daemon.daemon?.id === daemon.id) {
                this.containers.delete(container);
                console.log(`${red("<")} Disconnected container logger! (id: ${container}, daemon disconnected)`);
            }
        }
    }
}
export default DaemonLogManager;