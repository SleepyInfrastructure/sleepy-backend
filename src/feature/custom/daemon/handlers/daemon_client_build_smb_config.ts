/* Types */
import { Client, Connection, DaemonWebsocketMessageType } from "../types";
/* Node Imports */
import { red } from "nanocolors";
/* Local Imports */
import WebsocketMessageHandler from "./message";
import * as schemas from "../schemas";
import FeatureDaemon from "..";

class DaemonClientBuildSmbConfigMessageHandler extends WebsocketMessageHandler<schemas.WebsocketDaemonClientBuildSmbConfigMessageType> {
    constructor(parent: FeatureDaemon) {
        super(parent, [DaemonWebsocketMessageType.DAEMON_CLIENT_BUILD_SMB_CONFIG], schemas.WebsocketDaemonClientBuildSmbConfigMessage);
    }

    async handleClient(connection: Connection, message: schemas.WebsocketDaemonClientRequestResourcesMessageType, client: Client): Promise<void> {
        const requestedDaemon = this.parent.getDaemonForClient(client, message.id);
        if(requestedDaemon === null) {
            console.log(`${red("X")} No daemon found to build SMB config on! (id: ${message.id})`);
            return;
        }

        const instances = await this.parent.database.fetchMultiple<SMBInstance>({ source: "smbinstances", selectors: { server: message.id, author: client.id } });
        const config = [];
        config.push('version: "3"');
        config.push("services:");
        for(const instance of instances) {
            const shares = await this.parent.database.fetchMultiple<SMBShare>({ source: "smbshares", selectors: { parent: instance.id, author: client.id } });
            const users = await this.parent.database.fetchMultiple<SMBUser>({ source: "smbusers", selectors: { parent: instance.id, author: client.id } });

            config.push(`  sleepy-smb-${instance.name}:`);
            config.push(`    container_name: sleepy-smb-${instance.name}`);
            config.push('    network_mode: "host"');
            config.push("    restart: always");
            config.push("    image: dperson/samba");
            config.push("    volumes:");
            for(const share of shares) {
                config.push(`      - ${share.path}:/smb/${share.id}`);
            }
            const command = [];
            for(const user of users) {
                command.push("-u");
                command.push(`${user.name};%SMB_USER_${user.id}_PASSWORD%`);
            }
            for(const share of shares) {
                command.push("-s");
                let shareChunk = `${share.name};/smb/${share.id};${share.browsable ? "yes" : "no"};${share.readonly ? "yes" : "no"};${share.guest ? "yes" : "no"};`;
                const shareUsers = users.filter(e => share.users.includes(e.id));
                const shareAdmins = users.filter(e => share.admins.includes(e.id));
                shareChunk += `${shareUsers.map(e => e.name).join(",")};`;
                shareChunk += `${shareAdmins.map(e => e.name).join(",")};`;
                shareChunk += `${""};`;
                shareChunk += share.name;
                command.push(shareChunk);
            }
            command.push("-p");
            command.push("-n");
            if(instance.recycle === false) {
                command.push("-r");
            }
            config.push(`    command: [${command.map(e => `"${e}"`).join(", ")}]`);
        }

        requestedDaemon.send({ type: DaemonWebsocketMessageType.DAEMON_BUILD_SMB_CONFIG, config: config.join("\n") });
    }
}

export default DaemonClientBuildSmbConfigMessageHandler;