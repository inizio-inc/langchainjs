import { CompletionResponse, SamplingParameters } from "@anthropic-ai/sdk";
import { BaseChatModel, BaseChatModelParams } from "./base.js";
import { BaseChatMessage, ChatResult } from "../schema/index.js";
interface ModelParams {
    /** Amount of randomness injected into the response. Ranges
     * from 0 to 1. Use temp closer to 0 for analytical /
     * multiple choice, and temp closer to 1 for creative
     * and generative tasks.
     */
    temperature?: number;
    /** Only sample from the top K options for each subsequent
     * token. Used to remove "long tail" low probability
     * responses. Defaults to -1, which disables it.
     */
    topK?: number;
    /** Does nucleus sampling, in which we compute the
     * cumulative distribution over all the options for each
     * subsequent token in decreasing probability order and
     * cut it off once it reaches a particular probability
     * specified by top_p. Defaults to -1, which disables it.
     * Note that you should either alter temperature or top_p,
     * but not both.
     */
    topP?: number;
    /** A maximum number of tokens to generate before stopping. */
    maxTokensToSample: number;
    /** A list of strings upon which to stop generating.
     * You probably want ["\n\nHuman:"], as that's the cue for
     * the next turn in the dialog agent.
     */
    stopSequences?: string[];
    /** Whether to stream the results or not */
    streaming?: boolean;
}
/**
 * Input to AnthropicChat class.
 * @augments ModelParams
 */
interface AnthropicInput extends ModelParams {
    /** Anthropic API key */
    apiKey?: string;
    /** Model name to use */
    modelName: string;
    /** Holds any additional parameters that are valid to pass to {@link
     * https://console.anthropic.com/docs/api/reference |
     * `anthropic.complete`} that are not explicitly specified on this class.
     */
    invocationKwargs?: Kwargs;
}
type Kwargs = Record<string, any>;
/**
 * Wrapper around Anthropic large language models.
 *
 * To use you should have the `@anthropic-ai/sdk` package installed, with the
 * `ANTHROPIC_API_KEY` environment variable set.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://console.anthropic.com/docs/api/reference |
 * `anthropic.complete`} can be passed through {@link invocationKwargs},
 * even if not explicitly available on this class.
 *
 * @augments BaseLLM
 * @augments AnthropicInput
 */
export declare class ChatAnthropic extends BaseChatModel implements AnthropicInput {
    apiKey?: string;
    temperature: number;
    topK: number;
    topP: number;
    maxTokensToSample: number;
    modelName: string;
    invocationKwargs?: Kwargs;
    stopSequences: string[];
    streaming: boolean;
    private batchClient;
    private streamingClient;
    constructor(fields?: Partial<AnthropicInput> & BaseChatModelParams & {
        anthropicApiKey?: string;
    });
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(): Omit<SamplingParameters, "prompt"> & Kwargs;
    _identifyingParams(): {
        model: string;
        temperature?: number | undefined;
        top_p?: number | undefined;
        top_k?: number | undefined;
        max_tokens_to_sample: number;
        stop_sequences: string[];
        tags?: {
            [key: string]: string;
        } | undefined;
        model_name: string;
    };
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams(): {
        model: string;
        temperature?: number | undefined;
        top_p?: number | undefined;
        top_k?: number | undefined;
        max_tokens_to_sample: number;
        stop_sequences: string[];
        tags?: {
            [key: string]: string;
        } | undefined;
        model_name: string;
    };
    private formatMessagesAsPrompt;
    /**
     * Call out to Anthropic's endpoint with k unique prompts
     *
     * @param messages - The messages to pass into the model.
     * @param [stopSequences] - Optional list of stop sequences to use when generating.
     *
     * @returns The full LLM output.
     *
     * @example
     * ```ts
     * import { ChatAnthropic } from "langchain/llms";
     * const anthropic = new ChatAnthropic();
     * const response = await anthropic.generate(new HumanChatMessage(["Tell me a joke."]));
     * ```
     */
    _generate(messages: BaseChatMessage[], stopSequences?: string[]): Promise<ChatResult>;
    /** @ignore */
    completionWithRetry(request: SamplingParameters & Kwargs): Promise<CompletionResponse>;
    _llmType(): string;
    _combineLLMOutput(): never[];
}
export {};