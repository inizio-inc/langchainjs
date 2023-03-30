/* eslint-disable no-else-return */
import { z } from "zod";
import { BaseOutputParser, OutputParserException } from "../schema/index.js";
function printSchema(schema, depth = 0) {
    if (schema instanceof z.ZodString) {
        return "string";
    }
    else if (schema instanceof z.ZodArray) {
        return `${printSchema(schema._def.type, depth)}[]`;
    }
    else if (schema instanceof z.ZodObject) {
        const indent = "\t".repeat(depth);
        const indentIn = "\t".repeat(depth + 1);
        return `{${schema._def.description ? ` // ${schema._def.description}` : ""}
${Object.entries(schema.shape)
            .map(([key, value]) => 
        // eslint-disable-next-line prefer-template
        `${indentIn}"${key}": ${printSchema(value, depth + 1)}` +
            (value._def.description
                ? ` // ${value._def.description}`
                : ""))
            .join("\n")}
${indent}}`;
    }
    else {
        throw new Error(`Unsupported type: ${schema}`);
    }
}
export class StructuredOutputParser extends BaseOutputParser {
    constructor(schema) {
        super();
        Object.defineProperty(this, "schema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: schema
        });
    }
    static fromZodSchema(schema) {
        return new this(schema);
    }
    static fromNamesAndDescriptions(schemas) {
        const zodSchema = z.object(Object.fromEntries(Object.entries(schemas).map(([name, description]) => [name, z.string().describe(description)])));
        return new this(zodSchema);
    }
    getFormatInstructions() {
        return `Your ONLY response should be a fenced code block formatted in the following schema:

\`\`\`json
${printSchema(this.schema)}
\`\`\` 
`;
    }
    async parse(text) {
        try {
            let text2 = text.trim();
            // not very consistent using syntax highlighting
            text2 = text2.includes("```json")
                ? text2.split("```json")[1]
                : text2.split("```")[1];
            text2 = text2.split("```")[0].trim();
            return this.schema.parse(JSON.parse(text2));
        }
        catch (e) {
            throw new OutputParserException(`Failed to parse json: ${text}. Error: ${e}`);
        }
    }
}
//# sourceMappingURL=structured.js.map