/* Types */
import { FeatureServerOptions, FeatureType } from "../../../ts/base";

/* Options */
export type FeatureStaticOptions = FeatureServerOptions & {
    type: FeatureType.STATIC;

    root: string;
    roots?: string[];
};
