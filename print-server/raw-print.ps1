param($PrinterName, $DataFile, $DataType)
if (-not $DataType) { $DataType = "RAW" }
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter {
  [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
  static extern bool OpenPrinter(string p, out IntPtr h, IntPtr d);
  [DllImport("winspool.drv")] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
  static extern bool StartDocPrinter(IntPtr h, int l, ref DOCINFO d);
  [DllImport("winspool.drv")] static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv")] static extern bool WritePrinter(IntPtr h, IntPtr p, int c, out int w);
  struct DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
  public static bool Print(string n, byte[] d, string t) {
    IntPtr h; if (!OpenPrinter(n, out h, IntPtr.Zero)) return false;
    try { var di = new DOCINFO { pDocName = "Receipt", pDataType = t };
      if (!StartDocPrinter(h, 1, ref di)) return false;
      var p = Marshal.AllocHGlobal(d.Length); Marshal.Copy(d, 0, p, d.Length);
      int w; var ok = WritePrinter(h, p, d.Length, out w);
      Marshal.FreeHGlobal(p); EndDocPrinter(h); return ok && w == d.Length; }
    finally { ClosePrinter(h); }
  }
}
"@ | Out-Null
if (-not $PrinterName -or -not $DataFile) { exit }
[RawPrinter]::Print($PrinterName, [System.IO.File]::ReadAllBytes($DataFile), $DataType)
