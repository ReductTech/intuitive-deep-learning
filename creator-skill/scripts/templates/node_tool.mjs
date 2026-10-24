/** Replace this line with the tool's purpose.
 * Reads: describe the inputs and read scope.
 * Writes: describe output paths and overwrite behavior. This template writes nothing.
 */
import { emitResult, isMain, parseOptions, printHelp, reportError } from '../common/_cli.mjs';

export function buildParser() {
  // 按实际需要添加参数；类型、默认值和说明集中放在这里。
  return {
    help: { type: 'boolean', short: 'h', description: 'show help without executing the tool' },
  };
}

/**
 * 实现业务逻辑，返回结果，不打印整份命令结果。
 * @param {object} args 已解析的参数；写入前在此校验输入与目标路径。
 * @returns {Promise<object>} 工具结果；检查未通过使用 status: 'failed'，成功可省略 status。
 * @throws {Error} 输入、依赖或执行错误。
 */
export async function runTask(args) {
  // 替换此函数主体；可选依赖在实际使用时加载，进度使用 console.error。
  throw new Error('Implement runTask() before registering or using this tool.');
}

export async function main(argv = process.argv.slice(2)) {
  try {
    const options = buildParser();
    const args = parseOptions(argv, options);
    if (args.help) {
      printHelp('Replace this line with the tool\'s purpose.', options);
      return 0;
    }
    const result = await runTask(args);
    emitResult(result);
    if (result.status === 'error') return 2;
    return result.status === 'failed' ? 1 : 0;
  } catch (error) {
    return reportError(error);
  }
}

if (isMain(import.meta.url)) process.exitCode = await main();
