import { test, expect } from "@jest/globals";
import { SerpAPI } from "../tools/serpapi.js";
import { Calculator } from "../tools/calculator.js";
import { initializeAgentExecutor } from "../initialize.js";
import { ChatOpenAI } from "../../chat_models/openai.js";
test("Run ChatConversationalAgent locally", async () => {
    const model = new ChatOpenAI({ temperature: 0 });
    const tools = [new SerpAPI(), new Calculator()];
    const executor = await initializeAgentExecutor(tools, model, "chat-conversational-react-description");
    executor.returnIntermediateSteps = true;
    console.log("Loaded agent.");
    const input = `Who is Olivia Wilde's boyfriend and what is the square root of his current age?`;
    console.log(`Executing with input "${input}"...`);
    const result = await executor.call({ input, chat_history: [] });
    console.log(`Got output ${JSON.stringify(result, null, 2)}`);
    expect(result.intermediateSteps.length).toEqual(2);
    expect(result.intermediateSteps[0].action.tool).toEqual("search");
    expect(result.intermediateSteps[1].action.tool).toEqual("calculator");
}, 30000);
//# sourceMappingURL=chat_convo.int.test.js.map