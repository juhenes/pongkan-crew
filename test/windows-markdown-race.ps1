$ErrorActionPreference = 'Stop'
$request = [Console]::In.ReadToEnd() | ConvertFrom-Json
Add-Type -Path (Join-Path $PSScriptRoot '../src/windows-markdown.cs')
$script:blocked = 0
$attempt = "const fs = require('node:fs'); try { fs.renameSync(process.argv[1], process.argv[1] + '-swapped'); console.log(JSON.stringify({ blocked: false })); } catch (error) { console.log(JSON.stringify({ blocked: ['EPERM', 'EACCES', 'EBUSY'].includes(error.code), code: error.code })); }"
$probe = [Action] {
    foreach ($path in @($request.folder, (Join-Path $request.folder 'docs'), (Join-Path $request.folder 'docs/pongkan-docs'))) {
        $result = (& $request.node -e $attempt $path) | ConvertFrom-Json
        if (-not $result.blocked) { throw ('Directory replacement unexpectedly succeeded: ' + $path) }
        $script:blocked++
    }
}
$marker = '<!-- pongkan-crew export task-12345678 -->'
[PongkanMarkdownWriter]::Run($request.folder, 'task-12345678', ($marker + "`n# Protected response`n"), $probe)
[Console]::Out.Write((@{ blocked = $script:blocked } | ConvertTo-Json -Compress))
