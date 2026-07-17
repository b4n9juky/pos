Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter4 {
  [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
  static extern bool OpenPrinter(string p, out IntPtr h, IntPtr d);
  [DllImport("winspool.drv")] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
  static extern int StartDocPrinter(IntPtr h, int l, ref DOCINFO d);
  [DllImport("winspool.drv")] static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv")] static extern bool WritePrinter(IntPtr h, IntPtr p, int c, out int w);
  [DllImport("kernel32.dll")] static extern int GetLastError();

  struct DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }

  public static string PrintTest(string n, byte[] d, string t) {
    IntPtr h;
    if (!OpenPrinter(n, out h, IntPtr.Zero)) return "FAIL_OPEN:" + GetLastError();
    try {
      var di = new DOCINFO { pDocName = "Receipt", pDataType = t };
      int docId = StartDocPrinter(h, 1, ref di);
      if (docId == 0) return "FAIL_STARTDOC:" + GetLastError();
      var p = Marshal.AllocHGlobal(d.Length);
      Marshal.Copy(d, 0, p, d.Length);
      int w;
      if (!WritePrinter(h, p, d.Length, out w)) {
        int err = GetLastError();
        Marshal.FreeHGlobal(p);
        EndDocPrinter(h);
        return "FAIL_WRITE:" + err;
      }
      Marshal.FreeHGlobal(p);
      EndDocPrinter(h);
      return "OK:" + w;
    } finally { ClosePrinter(h); }
  }
}
"@

Write-Output "=== Testing with RAW ==="
# Simple ESC/POS test: just text and newlines
$rawData = [byte[]]@(0x1B, 0x40) + [System.Text.Encoding].ASCII.GetBytes("TEST LINE 1`r`nTEST LINE 2`r`n`r`n`r`n`r`n")
$r = [RawPrinter4]::PrintTest("EPSON TM-U220 Receipt", $rawData, "RAW")
Write-Output "Result: $r"

Write-Output "=== Testing with TEXT ==="
$textData = [System.Text.Encoding].ASCII.GetBytes("TEST LINE 1`r`nTEST LINE 2`r`n`r`n`r`n`r`n")
$r = [RawPrinter4]::PrintTest("EPSON TM-U220 Receipt", $textData, "TEXT")
Write-Output "Result: $r"
