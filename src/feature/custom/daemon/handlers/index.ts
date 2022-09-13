import DaemonsMessageHandler from "./daemons";
import DaemonAuthMessageHandler from "./daemon_auth";
import DaemonClientConnectContainerLogMessageHandler from "./daemon_client_connect_container_log";
import DaemonClientRequestDatabaseBackupMessageHandler from "./daemon_client_request_database_backup";
import DaemonClientRequestResourcesMessageHandler from "./daemon_client_request_resources";
import DaemonContainerLogMessageMessageHandler from "./daemon_container_log_message";
import DaemonRequestResourcesReplyMessageHandler from "./daemon_request_resources_reply";
import DaemonRequestStatsReplyMessageHandler from "./daemon_request_stats_reply";
import DaemonTaskProgressMessageHandler from "./daemon_task_progress";

export default [
    DaemonAuthMessageHandler,
    DaemonClientConnectContainerLogMessageHandler,
    DaemonClientRequestDatabaseBackupMessageHandler,
    DaemonClientRequestResourcesMessageHandler,
    DaemonContainerLogMessageMessageHandler,
    DaemonRequestResourcesReplyMessageHandler,
    DaemonRequestStatsReplyMessageHandler,
    DaemonTaskProgressMessageHandler,
    DaemonsMessageHandler
]