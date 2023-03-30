class ParseError extends Error {
    constructor(msg, output) {
        super(msg);
        Object.defineProperty(this, "output", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.output = output;
    }
}
/**
 * Class responsible for calling a language model and deciding an action.
 *
 * @remarks This is driven by an LLMChain. The prompt in the LLMChain *must*
 * include a variable called "agent_scratchpad" where the agent can put its
 * intermediary work.
 */
export class Agent {
    get inputKeys() {
        return this.llmChain.inputKeys.filter((k) => k !== "agent_scratchpad");
    }
    constructor(input) {
        Object.defineProperty(this, "llmChain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "allowedTools", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
        Object.defineProperty(this, "returnValues", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["output"]
        });
        this.llmChain = input.llmChain;
        this.allowedTools = input.allowedTools;
    }
    /**
     * Extract tool and tool input from LLM output.
     */
    async extractToolAndInput(_input) {
        throw new Error("Not implemented");
    }
    /**
     * Prepare the agent for a new call, if needed
     */
    prepareForNewCall() { }
    /**
     * Prepare the agent for output, if needed
     */
    async prepareForOutput(_returnValues, _steps) {
        return {};
    }
    /**
     * Create a prompt for this class
     *
     * @param tools - List of tools the agent will have access to, used to format the prompt.
     * @param fields - Additional fields used to format the prompt.
     *
     * @returns A PromptTemplate assembled from the given tools and fields.
     * */
    static createPrompt(_tools, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _fields) {
        throw new Error("Not implemented");
    }
    /** Construct an agent from an LLM and a list of tools */
    static fromLLMAndTools(_llm, _tools, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _args) {
        throw new Error("Not implemented");
    }
    /**
     * Validate that appropriate tools are passed in
     */
    static validateTools(_tools) { }
    _stop() {
        return [`\n${this.observationPrefix()}`];
    }
    /**
     * Name of tool to use to terminate the chain.
     */
    finishToolName() {
        return "Final Answer";
    }
    /**
     * Construct a scratchpad to let the agent continue its thought process
     */
    constructScratchPad(steps) {
        return steps.reduce((thoughts, { action, observation }) => thoughts +
            [
                action.log,
                `${this.observationPrefix()}${observation}`,
                this.llmPrefix(),
            ].join("\n"), "");
    }
    async _plan(steps, inputs, suffix) {
        const thoughts = this.constructScratchPad(steps);
        const newInputs = {
            ...inputs,
            agent_scratchpad: suffix ? `${thoughts}${suffix}` : thoughts,
        };
        if (this._stop().length !== 0) {
            newInputs.stop = this._stop();
        }
        const output = await this.llmChain.predict(newInputs);
        const parsed = await this.extractToolAndInput(output);
        if (!parsed) {
            throw new ParseError(`Invalid output: ${output}`, output);
        }
        const action = {
            tool: parsed.tool,
            toolInput: parsed.input,
            log: output,
        };
        if (action.tool === this.finishToolName()) {
            return { returnValues: { output: action.toolInput }, log: action.log };
        }
        return action;
    }
    /**
     * Decide what to do given some input.
     *
     * @param steps - Steps the LLM has taken so far, along with observations from each.
     * @param inputs - User inputs.
     *
     * @returns Action specifying what tool to use.
     */
    plan(steps, inputs) {
        return this._plan(steps, inputs);
    }
    /**
     * Return response when agent has been stopped due to max iterations
     */
    async returnStoppedResponse(earlyStoppingMethod, steps, inputs) {
        if (earlyStoppingMethod === "force") {
            return {
                returnValues: { output: "Agent stopped due to max iterations." },
                log: "",
            };
        }
        if (earlyStoppingMethod === "generate") {
            try {
                const action = await this._plan(steps, inputs, "\n\nI now need to return a final answer based on the previous steps:");
                if ("returnValues" in action) {
                    return action;
                }
                return { returnValues: { output: action.log }, log: action.log };
            }
            catch (err) {
                if (!(err instanceof ParseError)) {
                    throw err;
                }
                return { returnValues: { output: err.output }, log: err.output };
            }
        }
        throw new Error(`Invalid stopping method: ${earlyStoppingMethod}`);
    }
    /**
     * Load an agent from a json-like object describing it.
     */
    static async deserialize(data) {
        switch (data._type) {
            case "zero-shot-react-description": {
                const { ZeroShotAgent } = await import("./mrkl/index.js");
                return ZeroShotAgent.deserialize(data);
            }
            default:
                throw new Error("Unknown agent type");
        }
    }
}
//# sourceMappingURL=agent.js.map