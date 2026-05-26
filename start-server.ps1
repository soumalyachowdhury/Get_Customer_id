$NodePath = "C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $ProjectPath
Write-Host "Customer lookup agent will bind to http://127.0.0.1:3000"
& $NodePath .\server.js
