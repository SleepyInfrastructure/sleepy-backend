import { BuiltinFeatureType } from "./built-in";
import { CustomFeatureType } from "./custom";

export type FeatureOptions = {
    id: string;
    name: string;
    type: BuiltinFeatureType | CustomFeatureType;
};

export type FeatureServerOptions = FeatureOptions & {
    port: number;
    https: string;
    cors?: {
        origins: string[];
    };
    rateLimit?: boolean;
};