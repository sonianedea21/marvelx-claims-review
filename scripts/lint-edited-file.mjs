/**
 * Claude Code hook (PostToolUse on Edit / Write, see .claude/settings.json).
 * Lints the one file the agent just changed and hands any problems straight
 * back to it, so a broken token rule or hook dependency is fixed in the same
 * step instead of surfacing at the next `npm run lint`.
 *
 * Claude Code passes the tool call as JSON on stdin. Exit code 2 sends stderr
 * back to the agent; exit 0 means nothing to report.
 */
import { ESLint } from 'eslint';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const file = JSON.parse(input).tool_input?.file_path;

if (typeof file !== 'string' || !/\.(ts|tsx|js|mjs)$/.test(file)) process.exit(0);

const eslint = new ESLint();
if (await eslint.isPathIgnored(file)) process.exit(0);

const results = await eslint.lintFiles([file]);
if (results.every((result) => result.errorCount === 0)) process.exit(0);

const formatter = await eslint.loadFormatter('stylish');
process.stderr.write(`ESLint found problems in the file you just edited. Fix them now.\n${await formatter.format(results)}`);
process.exit(2);
