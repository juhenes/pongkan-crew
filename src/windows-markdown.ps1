$ErrorActionPreference = 'Stop'
try {
    Add-Type -Path (Join-Path $PSScriptRoot 'windows-markdown.cs')
    $request = [Console]::In.ReadToEnd() | ConvertFrom-Json
    [PongkanMarkdownWriter]::Run($request.folder, $request.key, $request.content, $null)
    [Console]::Out.Write('{"ok":true}')
} catch {
    [Console]::Out.Write((@{ error = $_.Exception.GetBaseException().Message } | ConvertTo-Json -Compress))
    exit 1
}
