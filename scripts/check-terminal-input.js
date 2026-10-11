import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { isatty } from 'node:tty';
// Optional end-to-end check: uses synthetic state and real Windows console records.
if (process.platform !== 'win32' || !isatty(0) || !process.stdout.isTTY)
  throw new Error('Run this check in an interactive Windows terminal.');
const folder = mkdtempSync(join(tmpdir(), 'pongkan-native-check-'));
let output = '';
const write = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, ...args) => {
  output += chunk;
  return write(chunk, ...args);
};
process.argv = [process.argv[0], 'src/cli.js', '--folder', folder];
const injector = join(folder, 'inject.ps1');
writeFileSync(
  injector,
  `param([int]$Key = 0, [int]$Wheel = 0, [string]$Text = '')
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class Inject {
 [StructLayout(LayoutKind.Explicit, Size=20)] public struct Record {
  [FieldOffset(0)] public ushort type;
  [FieldOffset(4)] public int down;
  [FieldOffset(8)] public ushort repeat;
  [FieldOffset(10)] public ushort key;
  [FieldOffset(14)] public char character;
  [FieldOffset(8)] public uint buttons;
  [FieldOffset(16)] public uint flags;
 }
 [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern IntPtr CreateFileW(string n,uint a,uint s,IntPtr sec,uint c,uint f,IntPtr t);
 [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern bool WriteConsoleInputW(IntPtr h, Record[] r, uint n, out uint written);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr h);
 public static void Send(int key,int wheel,string text) {
  IntPtr h=CreateFileW("CONIN$",0xC0000000,3,IntPtr.Zero,3,0,IntPtr.Zero);
  try {
   Record[] records;
   if(wheel!=0) records=new[]{new Record{type=2,buttons=unchecked((uint)wheel)<<16,flags=4}};
   else if(key!=0) records=new[]{new Record{type=1,down=1,repeat=1,key=(ushort)key}};
   else { records=new Record[text.Length]; for(int i=0;i<text.Length;i++) records[i]=new Record{type=1,down=1,repeat=1,character=text[i]}; }
   uint written; if(!WriteConsoleInputW(h,records,(uint)records.Length,out written)) throw new Exception("Injection failed");
  } finally { CloseHandle(h); }
 }
}
'@
[Inject]::Send($Key,$Wheel,$Text)
`,
);
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const inject = (...args) =>
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', injector, ...args], {
    windowsHide: true,
    stdio: ['inherit', 'pipe', 'pipe'],
    timeout: 10000,
  });
async function check(args, pattern) {
  output = '';
  inject(...args);
  for (let i = 0; i < 30 && !pattern.test(output); i++) await pause(100);
  assert.match(output, pattern);
}
await import('../src/cli.js');
try {
  for (let i = 0; i < 150 && !output.includes('chief>'); i++) await pause(100);
  assert.match(output, /chief>/);
  await pause(1000);
  await check(['-Text', '?'], /HELP \(1-11/);
  await check(['-Wheel', '-120'], /HELP \(4-14/);
  await check(['-Wheel', '120'], /HELP \(1-11/);
  await check(['-Key', '34'], /HELP \(11-21/);
  await check(['-Key', '33'], /HELP \(1-11/);
  await check(['-Text', '\x1b'], /Chief/);
  await check(['-Text', '/help scroll\r'], /HELP/);
  await check(['-Text', '\x1b'], /Chief/);
  await check(['-Text', 'draft'], /chief> draft/);
  await check(['-Key', '38'], /chief> \/help scroll/);
  await check(['-Key', '40'], /chief> draft/);
  inject('-Key', '36');
  await pause(200);
  await check(['-Text', 'X'], /chief> Xdraft/);
  inject('-Key', '35');
  await pause(200);
  await check(['-Text', ' Y'], /chief> Xdraft Y/);
  write('\nNATIVE INPUT CHECK PASSED: wheel, PgUp/PgDn, Up/Down, Home/End, Space\n');
} catch (error) {
  write('\nNATIVE INPUT CHECK FAILED: ' + error.message + '\n');
  process.exitCode = 1;
} finally {
  inject('-Text', '\x03');
}
