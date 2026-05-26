$NodePath = "C:\Users\Owner\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$PreferredPort = 3000
$FallbackPort = 3001

function Test-PortOpen {
    param([int]$Port)

    $Client = New-Object System.Net.Sockets.TcpClient
    try {
        $Client.Connect("127.0.0.1", $Port)
        return $true
    } catch {
        return $false
    } finally {
        $Client.Close()
    }
}

$Port = if (Test-PortOpen -Port $PreferredPort) { $FallbackPort } else { $PreferredPort }
$env:PORT = "$Port"

Set-Location $ProjectPath
Write-Host "Customer lookup agent running at http://127.0.0.1:$Port"
& $NodePath .\server.js
