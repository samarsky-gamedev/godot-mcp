import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, readFile, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve, join} from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

test('MCP handshake, scene creation, inspection, valid and invalid projects', {timeout:120000}, async () => {
  assert.ok(process.env.GODOT_PATH, 'Set GODOT_PATH to Godot 4 console executable');
  const folder = await mkdtemp(join(tmpdir(), 'godot mcp '));
  const client = new Client({name:'godot-acceptance', version:'1.0.0'}, {capabilities:{}});
  const transport = new StdioClientTransport({command:process.execPath, args:[resolve('build/index.js')], env:{...process.env}, stderr:'ignore'});
  const evidence = {date:new Date().toISOString(), folder, checks:[]};
  async function call(name,args={}) {
    return await client.callTool({name,arguments:args}, undefined, {timeout:90000});
  }
  try {
    await client.connect(transport);
    const list = await client.listTools();
    assert.equal(list.tools.length,16);
    evidence.checks.push({name:'initialize and tools/list',passed:true,tools:list.tools.map(x=>x.name)});
    const version = await call('get_godot_version');
    assert.ok(!version.isError); evidence.version=version;
    await writeFile(join(folder,'project.godot'),'config_version=5\n[application]\nconfig/name="Godot MCP demo"\nrun/main_scene="res://main.tscn"\n[rendering]\nrenderer/rendering_method="gl_compatibility"\n');
    const created = await call('create_scene',{projectPath:folder, scenePath:'main.tscn',rootNodeType:'Node2D'});
    assert.ok(!created.isError,JSON.stringify(created));
    const added = await call('add_node',{projectPath:folder,scenePath:'main.tscn',nodeType:'Label',nodeName:'Message',properties:{text:'Created through MCP'}});
    assert.ok(!added.isError,JSON.stringify(added));
    const tree = JSON.parse((await call('godot_inspect_scene',{projectPath:folder,scenePath:'res://main.tscn'})).content[0].text);
    assert.equal(tree.ok,true); assert.ok(tree.nodes.some(x=>x.name==='Message'));
    evidence.checks.push({name:'create_scene -> add_node -> inspect_scene',passed:true,result:tree});
    const good = await call('godot_validate_project',{projectPath:folder,frames:10});
    assert.equal(good.isError,false,JSON.stringify(good));
    evidence.checks.push({name:'valid scene import and runtime',passed:true,result:JSON.parse(good.content[0].text)});
    const badFrames = await call('godot_validate_project',{projectPath:folder,frames:0});
    assert.equal(badFrames.isError,true);
    await mkdir(join(folder,'nested'));
    await writeFile(join(folder,'nested','project.godot'),'config_version=5\n');
    const escape = await call('godot_inspect_scene',{projectPath:join(folder,'nested'),scenePath:'res://../main.tscn'});
    assert.equal(escape.isError,true);
    assert.match(escape.content[0].text,/inside project/);
    evidence.checks.push({name:'invalid frames and outside path rejected',passed:true});
    await writeFile(join(folder,'broken.gd'),'extends Node2D\nfunc _ready():\n\tthis is not valid GDScript !!!\n');
    await writeFile(join(folder,'main.tscn'),'[gd_scene load_steps=2 format=3]\n[ext_resource type="Script" path="res://broken.gd" id="1"]\n[node name="Main" type="Node2D"]\nscript = ExtResource("1")\n');
    const broken = await call('godot_validate_project',{projectPath:folder,frames:10});
    assert.equal(broken.isError,true,JSON.stringify(broken));
    evidence.checks.push({name:'broken GDScript reported as failure',passed:true,result:JSON.parse(broken.content[0].text)});
    await mkdir('evidence',{recursive:true});
    await writeFile('evidence/acceptance.json',JSON.stringify(evidence,null,2));
  } finally { await client.close(); }
});
