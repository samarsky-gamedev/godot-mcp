# MCP сервер для игрового движка Godot

## Подготовка к подключению

Установите Node.js 18+ с npm и Godot 4. Скачайте репозиторий и выполните в его папке:

```powershell
npm ci --ignore-scripts
npm run build
```

В конфигурациях ниже замените примеры абсолютных путей на свои:

- `C:\Program Files\nodejs\node.exe` — исполняемый файл Node.js;
- `C:\path\to\godot-mcp\build\index.js` — собранный сервер;
- `C:\path\to\Godot_console.exe` — исполняемый файл Godot.

## Подключение к Claude Code

Создайте `.mcp.json` в корне проекта, который открываете в Claude Code. Если файл уже существует, добавьте `godot_lab` в имеющийся объект `mcpServers`.

```json
{
  "mcpServers": {
    "godot_lab": {
      "type": "stdio",
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["C:\\path\\to\\godot-mcp\\build\\index.js"],
      "env": {
        "GODOT_PATH": "C:\\path\\to\\Godot_console.exe",
        "DEBUG": "false"
      }
    }
  }
}
```

Откройте Claude Code в этом проекте, подтвердите подключение проектного MCP-сервера при запросе и проверьте его состояние командой `/mcp`.

[Документация Claude Code по MCP](https://code.claude.com/docs/en/mcp).

## Подключение к Codex

Добавьте следующий блок в `~/.codex/config.toml` (в Windows — `%USERPROFILE%\.codex\config.toml`), сохранив остальные настройки:

```toml
[mcp_servers.godot_lab]
command = 'C:\Program Files\nodejs\node.exe'
args = ['C:\path\to\godot-mcp\build\index.js']
startup_timeout_sec = 30
tool_timeout_sec = 120

[mcp_servers.godot_lab.env]
GODOT_PATH = 'C:\path\to\Godot_console.exe'
DEBUG = 'false'
```

Начните новую сессию Codex. Для проверки подключения попросите: «Используй сервер godot_lab и получи версию Godot».

[Документация Codex по MCP](https://developers.openai.com/codex/mcp/).

## Отчёт

[Открыть отчёт по лабораторным работам (PDF)](materials/Отчёт.pdf).
