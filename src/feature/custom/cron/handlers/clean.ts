/* Types */
import { StatisticTimeMapping, StatisticTypeNextMapping } from "ts/common/const";
import { CronClean, CronCleanType, CronUpdateResourcesType } from "../types";

/* Node Imports */
import { bold, gray, yellow } from "nanocolors";
import Database from "../../../../database";

export async function processClean(database: Database, clean: CronClean) {
    switch(clean.type) {
        case CronCleanType.STATISTICS: {
            for(const resource of clean.resources) {
                processCleanStatistic(database, clean, resource);
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
export async function processCleanStatistic(database: Database, clean: CronClean, resource: CronUpdateResourcesType) {
    const time = StatisticTimeMapping[StatisticTypeNextMapping[clean.statistic]]
    switch(resource) {
        case CronUpdateResourcesType.GENERAL:
            const deletedStats = await database.delete({ source: "statistics", selectors: { type: clean.statistic, timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
            const deletedContainerStats = await database.delete({ source: "containerstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
            console.log(`${gray("-")} Deleted ${bold(yellow(deletedStats + deletedContainerStats))} old statistics...`);
            break;
            
        case CronUpdateResourcesType.DISKS:
            const deletedDiskStats = await database.delete({ source: "diskstatistics", selectors: { timestamp: { value: (Math.round(Date.now() / 1000) - time), comparison: "<" } } });
            console.log(`${gray("-")} Deleted ${bold(yellow(deletedDiskStats))} old disk statistics...`);
            break;
    }
}