using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32.SafeHandles;

// Pin every ancestor without FILE_SHARE_DELETE. A rename/junction swap must
// fail while these handles are held. OPEN_REPARSE_POINT inspects the object
// actually opened, rather than following a directory checked earlier.
public static class PongkanMarkdownWriter {
    [StructLayout(LayoutKind.Sequential)]
    struct FileInfo {
        public uint Attributes;
        public System.Runtime.InteropServices.ComTypes.FILETIME Creation, Access, Write;
        public uint Volume, SizeHigh, SizeLow, Links, IndexHigh, IndexLow;
    }
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern SafeFileHandle CreateFileW(string path, uint access, uint share,
        IntPtr security, uint disposition, uint flags, IntPtr template);
    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool GetFileInformationByHandle(SafeFileHandle handle, out FileInfo info);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    static extern bool MoveFileExW(string source, string target, uint flags);

    static SafeFileHandle LockDirectory(string path) {
        var handle = CreateFileW(path, 0x80000000, 3, IntPtr.Zero, 3, 0x02200000, IntPtr.Zero);
        if (handle.IsInvalid) { int error = Marshal.GetLastWin32Error(); handle.Dispose(); throw new Win32Exception(error, "Cannot lock Markdown directory: " + path); }
        FileInfo info;
        if (!GetFileInformationByHandle(handle, out info) || (info.Attributes & 0x400) != 0 || (info.Attributes & 0x10) == 0) {
            handle.Dispose(); throw new IOException("Unsafe Markdown directory: " + path);
        }
        return handle;
    }
    static void CheckDestination(string path, string marker) {
        var handle = CreateFileW(path, 0x80000000, 1, IntPtr.Zero, 3, 0x00200000, IntPtr.Zero);
        if (handle.IsInvalid) {
            int error = Marshal.GetLastWin32Error(); handle.Dispose();
            if (error == 2) return;
            throw new Win32Exception(error, "Unsafe Markdown destination: " + path);
        }
        using (handle) {
            FileInfo info;
            if (!GetFileInformationByHandle(handle, out info) || (info.Attributes & 0x410) != 0 || info.Links != 1)
                throw new IOException("Unsafe Markdown destination: " + path);
            using (var stream = new FileStream(handle, FileAccess.Read))
            using (var reader = new StreamReader(stream, Encoding.UTF8)) {
                var prefix = new char[marker.Length + 1];
                if (reader.ReadBlock(prefix, 0, prefix.Length) != prefix.Length || new string(prefix) != marker + "\n")
                    throw new IOException("Markdown filename conflict: " + path);
            }
        }
    }
    public static void Run(string folder, string key, string content, Action beforeWrite) {
        if (String.IsNullOrEmpty(key)) key = null;
        if (key != null && !System.Text.RegularExpressions.Regex.IsMatch(key, "\\A(task|discussion)-[a-f0-9]{8}\\z"))
            throw new IOException("Invalid Markdown record ID");
        var handles = new List<SafeFileHandle>();
        try {
            string full = Path.GetFullPath(folder).TrimEnd(Path.DirectorySeparatorChar);
            string path = Path.GetPathRoot(full);
            handles.Add(LockDirectory(path));
            string tail = full.Substring(path.Length);
            foreach (string segment in tail.Split(Path.DirectorySeparatorChar)) {
                if (segment.Length == 0) continue;
                path = Path.Combine(path, segment);
                handles.Add(LockDirectory(path));
            }
            foreach (string segment in new [] { "docs", "pongkan-docs" }) {
                path = Path.Combine(path, segment);
                // Parent is locked; inspect/lock this child before descending.
                Directory.CreateDirectory(path);
                handles.Add(LockDirectory(path));
            }
            if (beforeWrite != null) beforeWrite();
            if (key == null) return;
            string destination = Path.Combine(path, key + ".md");
            string marker = "<!-- pongkan-crew export " + key + " -->";
            CheckDestination(destination, marker);
            string temporary = Path.Combine(path, ".pongkan-export-" + Guid.NewGuid() + ".tmp");
            bool created = false;
            try {
                using (var stream = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None)) {
                    created = true;
                    byte[] bytes = new UTF8Encoding(false).GetBytes(content);
                    stream.Write(bytes, 0, bytes.Length); stream.Flush(true);
                }
                CheckDestination(destination, marker);
                if (!MoveFileExW(temporary, destination, 9)) throw new Win32Exception(Marshal.GetLastWin32Error(), "Cannot replace Markdown document: " + destination);
                created = false;
            } finally { if (created) File.Delete(temporary); }
        } finally {
            for (int index = handles.Count - 1; index >= 0; index--) handles[index].Dispose();
        }
    }
}
