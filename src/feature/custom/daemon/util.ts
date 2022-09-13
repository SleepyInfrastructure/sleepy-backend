/* Node Imports */
import { red } from "nanocolors";
import { z } from "zod";

export function validate<T>(schema: z.Schema, data: object): (T | null) {
    const result = schema.safeParse(data);
    if(!result.success) {
        console.log(`${red("X")} Message failed validation! (${result.error.toString()})`);
        return null;
    }
    
    return result.data;
}