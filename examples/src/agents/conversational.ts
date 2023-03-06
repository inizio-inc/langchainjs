import { OpenAI } from "langchain";
import { SerpAPI, Calculator } from "langchain/tools";
import { ConversationalAgent, AgentExecutor } from "langchain/agents";
import { LLMChain } from "langchain/chains";

export const run = async () => {
  const model = new OpenAI({ temperature: 0 });

  const tools = [new SerpAPI(), new Calculator()];

  const prompt = ConversationalAgent.createPrompt(tools);

  const llmChain = new LLMChain({ llm: model, prompt });

  const agent = new ConversationalAgent({
    llmChain,
  });

  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
    returnIntermediateSteps: true,
  });

  const inputs = [
    `Hi agent, I am bob`,
    `Who is Olivia Wilde's boyfriend? What is his current age raised to the 0.23 power?`,
    `What is my name?`,
  ];

  const chatHistory: string[] = [];
  for (const input of inputs) {
    console.log(`Executing with input "${input}"...`);

    const result = await executor.call({ input, chat_history: chatHistory });

    console.log(`Got output ${result.output}`);

    console.log(
      `Got intermediate steps ${JSON.stringify(
        result.intermediateSteps,
        null,
        2
      )}`
    );

    chatHistory.push(`Q:${input}. A:${result.output}`);
  }
};
