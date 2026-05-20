$NodePath = "C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$ProjectPath = "C:\Users\Owner\Documents\Codex\2026-05-20\what-is-agent-sandbox"

Set-Location $ProjectPath
& $NodePath .\server.js
