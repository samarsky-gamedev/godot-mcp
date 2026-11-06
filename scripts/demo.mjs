import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {mkdir, writeFile, access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const folder=resolve(process.argv[2] || 'demo-output');
try {await access(folder); throw new Error('Output already exists; choose a NEW empty directory.');} catch(e) {if(e.code!=='ENOENT') throw e;}
if(!process.env.GODOT_PATH) throw new Error('Set GODOT_PATH');
await mkdir(folder,{recursive:true});
await writeFile(join(folder,'project.godot'),'config_version=5\n[application]\nconfig/name="Godot MCP demonstration"\nrun/main_scene="res://main.tscn"\n[display]\nwindow/size/viewport_width=900\nwindow/size/viewport_height=500\n[rendering]\nrenderer/rendering_method="gl_compatibility"\n');
const client = new Client({name:'godot-demo',version:'1.0.0'},{capabilities:{}});
const transport = new StdioClientTransport({command:process.execPath,args:[resolve('build/index.js')],env:{...process.env},stderr:'ignore'});
const trace=[];
async function call(name,args){const result=await client.callTool({name,arguments:args},undefined,{timeout:90000});trace.push({name,result});if(result.isError)throw new Error(JSON.stringify(result));return result;}
try {
 await client.connect(transport);
 await call('create_scene',{projectPath:folder,scenePath:'main.tscn',rootNodeType:'Node2D'});
 await call('add_node',{projectPath:folder,scenePath:'main.tscn',nodeType:'Label',nodeName:'Title',properties:{text:'GODOT MCP\n\nThis scene was created through MCP tools.\n\n1. create_scene\n2. add_node\n3. godot_inspect_scene\n4. godot_validate_project\n\nSource project and logs are editable.'}});
 await call('godot_inspect_scene',{projectPath:folder,scenePath:'res://main.tscn'});
 await call('godot_validate_project',{projectPath:folder,frames:60});
 await writeFile(join(folder,'mcp-trace.json'),JSON.stringify(trace,null,2));
 console.log('Created and validated: '+folder);
} finally {await client.close();}
