/* Root Options */
export type RootOptions = {
    instances: string[];
};

/* Worker Server */
export type InstanceOptions = {
    id: string;
    name: string;
    features: any[];
    databases: any[];
};

/* Features */
export enum FeatureType {
    STATIC = "STATIC",
    API = "API",
    DAEMON = "DAEMON",
    DAEMON_CRON = "DAEMON_CRON",
}

export type FeatureOptions = {
    id: string;
    name: string;
    type: FeatureType;
};

export type FeatureServerOptions = FeatureOptions & {
    port: number;
    https: boolean;
    cors?: {
        origins: string[];
    };
    rateLimit?: boolean;
};

/* Databases */
export enum DatabaseType {
    MYSQL = "MYSQL",
    REDIS = "REDIS",
}

export type DatabaseOptions = {
    id: string;
    name: string;
    type: DatabaseType;
};

export type DatabaseSelectorValue = string | number | DatabaseFetchSelector;
export type DatabaseItemValue = string | number | null;

export type DatabaseFetchOptions = {
    source: string;
    selectors: Record<string, string | number | DatabaseFetchSelector>;
    ignoreSensitive?: boolean;
    sort?: DatabaseSort;
};

export type DatabaseFetchSelector = {
    value: string | number;
    comparison: ">" | ">=" | "<" | "<>" | "!=" | "<=" | "<=>" | "=";
};

export type DatabaseFetchMultipleOptions = DatabaseFetchOptions & {
    offset?: number;
    limit?: number;
};

export type DatabaseSort = {
    order?: "ASC" | "DESC";
    field: string;
};

export type DatabaseAddOptions = {
    destination: string;
    item: Record<string, DatabaseItemValue>;
};

export type DatabaseEditOptions = {
    destination: string;
    selectors: Record<string, DatabaseSelectorValue>;
    item: Record<string, DatabaseItemValue>;
};

export type DatabaseDeleteOptions = {
    source: string;
    selectors: Record<string, DatabaseSelectorValue>;
};

/* Statuses */
export type StateDescriptor = {
    status: Status;
    message: string;
};

export enum Status {
    WAITING = "WAITING",
    SUCCESS = "SUCCESS",
    ERROR = "ERROR",
}
