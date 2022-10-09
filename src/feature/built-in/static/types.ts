/* Types */
import { FeatureServerOptions, FeatureType } from "../../../ts/backend/base";

/* Options */
export type FeatureStaticOptions = FeatureServerOptions & {
    type: FeatureType.STATIC;

    root: string;
    roots?: string[];
};
