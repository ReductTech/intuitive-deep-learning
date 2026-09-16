import { runDemoAgent } from "./demoAgent";
import { runLiveAgent, type RunAgentParams } from "./agent";

/** 统一入口：根据当前模式选择真实 LLM 或离线演示运行时 */
export async function runAgentTurn(params: RunAgentParams): Promise<void> {
  if (params.settings.mode === "demo") {
    return runDemoAgent(params);
  }
  return runLiveAgent(params);
}

export { friendlyError } from "./agent";
export type { RunAgentParams } from "./agent";