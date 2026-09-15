import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { calculate } from "./src/lib/calculator.ts";

const calc = tool(
  async ({ expression }) => `结果：${calculate(expression)}`,
  { name: "calculator", description: "计算数学表达式", schema: z.object({ expression: z.string() }) },
);

async function probe(model) {
  const llm = new ChatOpenAI({
    model,
    apiKey: "sk-zk281ac3a0d2915b73ecc252dbcc1657a1a6aa92dd640611",
    configuration: { baseURL: "https://api.zhizengzeng.com/v1" },
    streaming: true,
    temperature: 0.2,
  });
  const agent = createAgent({ model: llm, tools: [calc], systemPrompt: "必须先调用工具计算，不要心算。" });
  const seen = new Set();
  let text = "";
  const stream = agent.streamEvents(
    { messages: [{ role: "user", content: "算一下 (17*23+9)^0.5 是多少" }] },
    { version: "v2" },
  );
  for await (const ev of stream) {
    seen.add(ev.event);
    if (ev.event === "on_chat_model_stream") {
      const c = ev.data?.chunk?.content;
      if (typeof c === "string") text += c;
    }
  }
  console.log(`\n### ${model}\n events: ${[...seen].join(", ")}\n text: ${text.trim().slice(0, 200)}`);
}

for (const m of process.argv.slice(2)) {
  try {
    await probe(m);
  } catch (e) {
    console.log(`### ${m} FAILED: ${e.message.slice(0, 200)}`);
  }
}