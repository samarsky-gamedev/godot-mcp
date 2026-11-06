// project contributors additions. Upstream tools stay in index.ts.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
const execute = promisify(execFile);
const schema = {type: 'object', properties: {projectPath: {type: 'string', description: 'Absolute trusted Godot project directory'}}, required: ['projectPath'], additionalProperties: false};
export const godotTools = [
  {name: 'godot_inspect_scene', description: 'Read the saved scene hierarchy without instantiating nodes. Not the live runtime tree.', inputSchema: {...schema, properties: {...schema.properties, scenePath: {type: 'string', description: 'res:// scene path inside project'}}, required: ['projectPath', 'scenePath']}},
  {name: 'godot_validate_project', description: 'Import a trusted project then run a bounded headless smoke test. Returns stage logs and detected errors; does not prove gameplay quality.', inputSchema: {...schema, properties: {...schema.properties, frames: {type: 'integer', minimum: 1, maximum: 600, default: 60}}}},
];
export async function projectDirectory(value: unknown): Promise<string> {
  if (typeof value !== 'string' || !isAbsolute(value)) throw new Error('projectPath must be absolute');
  const root = await realpath(value);
  if (!(await stat(resolve(root, 'project.godot'))).isFile()) throw new Error('project.godot missing');
  return root;
}
async function scenePath(root: string, value: unknown): Promise<string> {
  if (typeof value !== 'string' || !value.startsWith('res://') || !value.endsWith('.tscn')) throw new Error('scenePath must be res://...tscn');
  const actual = await realpath(resolve(root, value.slice(6)));
  const rel = relative(root, actual);
  if (rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) throw new Error('Scene must remain inside project');
  return 'res://' + rel.split(sep).join('/');
}
export async function runGodot(godot: string, args: string[], timeout = 30000) {
  try {
    const {stdout, stderr} = await execute(godot, args, {timeout, maxBuffer: 2 * 1024 * 1024, windowsHide: true});
    return {ok: !/(?:SCRIPT ERROR|(?:^|\n)ERROR):/.test(stdout + '\n' + stderr), exitCode: 0, stdout, stderr};
  } catch (error: any) {
    return {ok: false, exitCode: error.code ?? null, stdout: String(error.stdout ?? ''), stderr: String(error.stderr ?? error.message), timedOut: Boolean(error.killed)};
  }
}
export async function handleGodot(name: string, args: Record<string, unknown>, godot: string, inspector: string) {
  try {
    const root = await projectDirectory(args.projectPath);
    let result: any;
    if (name === 'godot_inspect_scene') {
      const scene = await scenePath(root, args.scenePath);
      const stage = await runGodot(godot, ['--headless', '--path', root, '--script', inspector, '--', scene]);
      const payload = stage.stdout.split(/\r?\n/).find(line => line.startsWith('GODOT_JSON:'));
      result = stage.ok && payload ? {ok: true, ...JSON.parse(payload.slice('GODOT_JSON:'.length))} : {...stage, ok: false};
    } else if (name === 'godot_validate_project') {
      const frames = args.frames ?? 60;
      if (!Number.isInteger(frames) || Number(frames) < 1 || Number(frames) > 600) throw new Error('frames must be integer 1..600');
      const imported = await runGodot(godot, ['--headless', '--path', root, '--editor', '--quit'], 60000);
      const runtime = imported.ok ? await runGodot(godot, ['--headless', '--path', root, '--quit-after', String(frames)]) : null;
      result = {ok: imported.ok && runtime?.ok === true, projectPath: root, frames, stages: {import: imported, runtime}, limitation: 'Bounded smoke test only; no gameplay, visual, network or security certification.'};
    } else throw new Error('Unknown Godot tool');
    return {content: [{type: 'text', text: JSON.stringify(result, null, 2)}], isError: !result.ok};
  } catch (error) {
    return {content: [{type: 'text', text: JSON.stringify({ok: false, error: String(error)})}], isError: true};
  }
}
