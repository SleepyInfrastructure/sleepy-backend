/* Types */
import { CronClean, CronCleanType, CronStatisticNextMapping, CronStatisticTimeMapping } from "../types";

/* Node Imports */
import { bold, gray, yellow } from "nanocolors";
import Database from "../../../../database";

export default async function processClean(database: Database, clean: CronClean) {
    switch(clean.type) {
        case CronCleanType.STATISTICS: {
            const time = CronStatisticTimeMapping[CronStatisticNextMapping[clean.statistic]]
            for(const resource of clean.resources) {
                switch(resource) {
                    case "GENERAL":
                        const deletedStats = await database.delete({ source: "statistics", selectors: { type: clean.statistic, timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
                        const deletedContainerStats = await database.delete({ source: "containerstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
                        console.log(`${gray("-")} Deleted ${bold(yellow(deletedStats + deletedContainerStats))} old statistics...`);
                        break;
                        
                    case "DISKS":
                        const deletedDiskStats = await database.delete({ source: "diskstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
                        console.log(`${gray("-")} Deleted ${bold(yellow(deletedDiskStats))} old disk statistics...`);
                        break;
                }
            }
            break;
        }

        case CronCleanType.UPTIME_STATISTICS: {
            const deletedStats = await database.delete({ source: "uptimestatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
            console.log(`${gray("-")} Deleted ${bold(yellow(deletedStats))} old uptime statistics...`);
            break;
        }

        case CronCleanType.TASKS: {
            const deletedTasks = await database.delete({ source: "tasks", selectors: { end: { value: (Math.round(Date.now() / 1000) - clean.time), comparison: "<" } } });
            console.log(`${gray("-")} Deleted ${bold(yellow(deletedTasks))} old tasks...`);
            break;
        }
    }
}