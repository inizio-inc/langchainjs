import { z } from "zod";
import { LLMChain } from "../../chains/index.js";
import { Agent } from "../agent.js";
import {
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "../../prompts/index.js";
import { renderTemplate } from "../../prompts/template.js";
import {
  FORMAT_TEMPLATE,
  PREFIX,
  SUFFIX,
  TEMPLATE_TOOL_RESPONSE,
} from "./prompt.js";
import { BaseLanguageModel } from "../../base_language/index.js";
import {
  AgentStep,
  BaseChatMessage,
  AIChatMessage,
  HumanChatMessage,
  BaseOutputParser,
} from "../../schema/index.js";
import { AgentInput } from "../types.js";
import { Tool } from "../tools/base.js";
import {
  StructuredOutputParser,
  OutputFixingParser,
} from "../../output_parsers/index.js";

export type CreatePromptArgs = {
  /** String to put after the list of tools. */
  systemMessage?: string;
  /** String to put before the list of tools. */
  humanMessage?: string;
  /** List of input variables the final prompt will expect. */
  inputVariables?: string[];
  /** Output parser to use for formatting. */
  outputParser?: BaseOutputParser;
  /** The name of the tool used to return response. */
  finishToolName?: string;
};

export interface ChatConversationalAgentInput extends AgentInput {
  outputParser?: BaseOutputParser;
  finishToolName?: string;
}

/**
 * Agent for the MRKL chain.
 * @augments Agent
 */
export class ChatConversationalAgent extends Agent {
  outputParser: BaseOutputParser;

  finished: string;

  constructor(input: ChatConversationalAgentInput) {
    super(input);
    this.finished = input.finishToolName ?? "finished";
    this.outputParser =
      input.outputParser ??
      OutputFixingParser.fromLLM(
        input.llmChain.llm,
        StructuredOutputParser.fromZodSchema(
          z
            .object({
              thought: z
                .string()
                .describe(
                  `You must think concisely whether the next tool should be ${this.finishToolName()} and why`
                ),
              tool: z
                .string()
                .describe(
                  `you MUST provide the name of a tool to use (${this.finishToolName()},${input.allowedTools?.join()})`
                ),
              input: z.string().describe("the valid input to the tool"),
            })
            .describe("Only one object is ever allowed")
        )
      );
  }

  _agentType(): string {
    /** Not turning on serialization until more sure of abstractions. */
    throw new Error("Method not implemented.");
  }

  observationPrefix() {
    return "";
  }

  llmPrefix() {
    return "";
  }

  finishToolName(): string {
    return this.finished;
  }

  _stop(): string[] {
    return [];
  }

  static validateTools(tools: Tool[]) {
    const invalidTool = tools.find((tool) => !tool.description);
    if (invalidTool) {
      const msg =
        `Got a tool ${invalidTool.name} without a description.` +
        ` This agent requires descriptions for all tools.`;
      throw new Error(msg);
    }
  }

  constructScratchPad(steps: AgentStep[]): BaseChatMessage[] {
    const thoughts: BaseChatMessage[] = [];
    for (const step of steps) {
      thoughts.push(new AIChatMessage(step.action.log));
      thoughts.push(
        new AIChatMessage(
          renderTemplate(TEMPLATE_TOOL_RESPONSE, "f-string", {
            observation: step.observation,
            toolName: step.action.tool,
          })
        )
      );
    }

    thoughts.push(
      new HumanChatMessage(
        renderTemplate(FORMAT_TEMPLATE, "f-string", {
          format_instructions: this.outputParser.getFormatInstructions(),
        })
      )
    );

    return thoughts;
  }

  /**
   * Create prompt in the style of the zero shot agent.
   *
   * @param tools - List of tools the agent will have access to, used to format the prompt.
   * @param args - Arguments to create the prompt with.
   * @param args.suffix - String to put after the list of tools.
   * @param args.prefix - String to put before the list of tools.
   */
  static createPrompt(tools: Tool[], args?: CreatePromptArgs) {
    const { systemMessage = PREFIX, humanMessage = SUFFIX } = args ?? {};
    const toolStrings = tools
      .map((tool) => `${tool.name}: ${tool.description}`)
      .join("\n");
    const finalPrompt = renderTemplate(humanMessage, "f-string", {
      tools: toolStrings,
      finishToolName: args?.finishToolName,
    });
    const messages = [
      SystemMessagePromptTemplate.fromTemplate(systemMessage),
      new MessagesPlaceholder("chat_history"),
      HumanMessagePromptTemplate.fromTemplate(finalPrompt),
      new MessagesPlaceholder("agent_scratchpad"),
    ];
    return ChatPromptTemplate.fromPromptMessages(messages);
  }

  static fromLLMAndTools(
    llm: BaseLanguageModel,
    tools: Tool[],
    args: CreatePromptArgs = {
      finishToolName: "finished",
    }
  ) {
    ChatConversationalAgent.validateTools(tools);

    const prompt = ChatConversationalAgent.createPrompt(tools, args);
    const chain = new LLMChain({ prompt, llm });

    return new ChatConversationalAgent({
      llmChain: chain,
      allowedTools: tools.map((t) => t.name),
      finishToolName: args.finishToolName,
    });
  }

  async extractToolAndInput(
    text: string
  ): Promise<{ tool: string; input: string } | null> {
    return (await this.outputParser.parse(text)) as {
      tool: string;
      input: string;
    };
  }
}
