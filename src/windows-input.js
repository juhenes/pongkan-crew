import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function startWindowsInput(launch = spawn) {
  const child = launch('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-File',
    fileURLToPath(new URL('./windows-input.ps1', import.meta.url))],
  { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  return child;
}

// Open the shared console directly: the helper's standard streams are pipes.
function consoleMode(restore) {
  const script = `
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PongkanConsole {
  [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern IntPtr CreateFileW(string name, uint access, uint share, IntPtr security, uint creation, uint flags, IntPtr template);
  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool GetConsoleMode(IntPtr handle, out uint mode);
  [DllImport("kernel32.dll", SetLastError=true)]
  public static extern bool SetConsoleMode(IntPtr handle, uint mode);
  [DllImport("kernel32.dll")]
  public static extern bool CloseHandle(IntPtr handle);
}
'@
$handle = [PongkanConsole]::CreateFileW('CONIN$', 3221225472, 3, [IntPtr]::Zero, 3, 0, [IntPtr]::Zero)
try {
  [uint32]$original = 0
  if (-not [PongkanConsole]::GetConsoleMode($handle, [ref]$original)) { throw 'Cannot read console input mode' }
  [uint32]$target = ${restore === null ? '($original -bor 0x0200 -bor 0x0010 -bor 0x0080) -band (-bnot 0x0040)' : restore}
  if (-not [PongkanConsole]::SetConsoleMode($handle, $target)) { throw 'Cannot set console input mode' }
  [Console]::WriteLine($original)
} finally { [void][PongkanConsole]::CloseHandle($handle) }
`;
  return Number(execFileSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
    { windowsHide: true, encoding: 'utf8', timeout: 10000 }).trim());
}

export function enableWindowsMouse(platform = process.platform, setMode = consoleMode) {
  if (platform !== 'win32') return () => {};
  const original = setMode(null);
  if (!Number.isInteger(original) || original < 0) throw new Error('Invalid console input mode');
  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    setMode(original);
  };
}
