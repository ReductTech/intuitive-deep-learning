/** Small CLI helpers: argument parsing, help and one JSON result. No tool registration. */
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
export function parseOptions(argv, definitions) {
    const options = Object.fromEntries(Object.entries(definitions).map(([name, definition]) => {
        const { description, ...option } = definition;
        return [name, option];
    }));
    return parseArgs({ args: argv, options, strict: true }).values;
}
export function printHelp(description, definitions) {
    console.log(description);
    for (const [name, option] of Object.entries(definitions)) {
        const value = option.type === 'string' ? ' <value>' : '';
        const fallback = option.default === undefined ? '' : ` (default: ${option.default})`;
        console.log(`  --${name}${value}  ${option.description}${fallback}`);
    }
}
export function emitResult(result, status = 'ok') {
    console.log(JSON.stringify({ status, ...result }));
}
export function reportError(error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    emitResult({ error: message }, 'error');
    return 2;
}
export function isMain(url) {
    return Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === url;
}
