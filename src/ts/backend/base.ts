import { RouteFetchStructuredItemImportedOptions, RouteFetchStructuredItemOptions } from "../../feature/built-in/api/routes/built-in";

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
    CRON = "CRON",
}

export type FeatureOptions = {
    id: string;
    name: string;
    type: FeatureType;
};

export type FeatureServerOptions = FeatureOptions & {
    port: number;
    https: string;
    cors?: {
        origins: string[];
    };
    rateLimit?: boolean;
};

/* API Structures */
export type APIStructure = Record<string, RouteFetchStructuredItemOptions>;
export type APIStructureImported = Record<string, RouteFetchStructuredItemImportedOptions>;
export type APIStructureImportedDetails = {
    hasAuthorField: boolean;
};

export type APIStructureOptions = {
    id: string;
    structure: APIStructure;
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
