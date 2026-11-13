# MCP сервер для игрового движка Godot

Локальный MCP-сервер для работы со сценами и проверки запуска проектов Godot 4. Требуется Node.js 18+ с npm.

В PowerShell из папки репозитория выполните сборку и укажите путь к Godot:

```powershell
npm ci
$server = (Resolve-Path .\build\index.js).Path
$godot = 'C:\путь\к\Godot_console.exe'
```

Подключите сервер командой для своего клиента:

```powershell
# Claude Code
claude mcp add --env "GODOT_PATH=$godot" --transport stdio --scope user godot -- node "$server"

# Codex
codex mcp add godot --env "GODOT_PATH=$godot" -- node "$server"
```

Откройте новую сессию и попросите получить версию Godot. Для [DeepSeek через Claude Code](https://api-docs.deepseek.com/quick_start/agent_integrations/claude_code/) подключение MCP остаётся тем же.

[Отчёт по проекту (PDF)](https://github.com/samarsky-gamedev/godot-mcp/blob/1e5a5b7b04ef2e08ccac55748af4d7b439be84bc/materials/%D0%9E%D1%82%D1%87%D1%91%D1%82.pdf)
