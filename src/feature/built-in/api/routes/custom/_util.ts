import Database from "../../../../../database";
import FeatureDaemon from "../../../../custom/daemon";
/* Node Imports */
import path from "path";
import { rm } from "fs";

export async function deleteServer(feature: FeatureDaemon, database: Database, id: string, author: string): Promise<boolean> {
    /* Delete server */
    const server = await database.delete({ source: "servers", selectors: { id: id, author: author } });
    if(server < 1) {
        return false;
    }

    /* Disconnect daemons */
    const disconnect = feature.connections.filter(e => e.daemon !== null && e.daemon.id === id);
    for(const daemon of disconnect) {
        daemon.disconnect();
    }

    /* Delete related objects */
    database.delete({ source: "containerprojects", selectors: { server: id, author: author } });
    database.delete({ source: "containers", selectors: { server: id, author: author } });
    // TODO: containerstatistics
    database.delete({ source: "daemontokens", selectors: { server: id, author: author } });
    database.delete({ source: "databases", selectors: { server: id, author: author } });
    database.delete({ source: "disks", selectors: { server: id, author: author } });
    // TODO: diskstatistics
    // TODO: networks (unless it's used)
    database.delete({ source: "partitions", selectors: { server: id, author: author } });
    // TODO: serverconfigs (unless it's used)
    database.delete({ source: "serversoftware", selectors: { server: id, author: author } });
    database.delete({ source: "statistics", selectors: { server: id, author: author } });
    database.delete({ source: "zfspartitions", selectors: { server: id, author: author } });
    database.delete({ source: "zfspools", selectors: { server: id, author: author } });

    return true;
}

export async function deleteSmbInstance(database: Database, id: string, author: string): Promise<boolean> {
    /* Delete instance */
    const instance = await database.delete({ source: "smbinstances", selectors: { id: id, author: author } });
    if(instance < 1) {
        return false;
    }

    /* Delete related objects */
    const shares = await database.fetchMultiple<SMBShare>({ source: "smbshares", selectors: { parent: id, author: author } });
    for(const share of shares) {
        deleteSmbShare(database, share.id, author);
    }

    return true;
}

export async function deleteSmbShare(database: Database, id: string, author: string): Promise<boolean> {
    /* Delete server */
    const share = await database.delete({ source: "smbshares", selectors: { id: id, author: author } });
    if(share < 1) {
        return false;
    }

    /* Delete related objects */
    database.delete({ source: "smbusers", selectors: { parent: id, author: author } });

    return true;
}

export async function deleteUptimeEndpoint(database: Database, id: string, author: string): Promise<boolean> {
    /* Delete server */
    const endpoint = await database.delete({ source: "uptimeendpoints", selectors: { id: id, author: author } });
    if(endpoint < 1) {
        return false;
    }

    /* Delete related objects */
    database.delete({ source: "uptimestatistics", selectors: { parent: id, author: author } });

    return true;
}

export async function deleteTask(database: Database, id: string, author: string): Promise<boolean> {
    /* Get task */
    const task = await database.fetch<Task>({ source: "tasks", selectors: { id: id, author: author } });
    if(task === null) {
        return false;
    }

    /* Delete task */
    database.delete({ source: "tasks", selectors: { id: id, author: author } });

    /* Delete related objects */
    const root = "/usr/src/sleepy/data/user";
    switch(task.type) {
        case TaskType.BACKUP_DATABASE:
            if(task.result !== null) {
                const file = await database.fetch<UserFile>({ source: "userfiles", selectors: { id: task.result, author: author }, ignoreSensitive: true });
                if(file === null || file.path === undefined) {
                    break;
                }
                database.delete({ source: "userfiles", selectors: { id: task.result, author: author } });
                const filePath = path.join(root, file.path);
                if(filePath.indexOf(root) !== 0) {
                    break;
                }
                rm(filePath, () => { return; });
            }
            break;
    }

    return true;
}