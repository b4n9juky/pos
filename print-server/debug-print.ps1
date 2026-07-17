param($PrinterName, $DataFile, $DataType)
if (-not $DataType) { $DataType = "TEXT" }
if (-not $DataFile) { $DataFile = "" }

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter2 {
  [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
  static extern bool OpenPrinter(string p, out IntPtr h, IntPtr d);
  [DllImport("winspool.drv")] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
  static extern bool StartDocPrinter(IntPtr h, int l, ref DOCINFO d);
  [DllImport("winspool.drv")] static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv")] static extern bool WritePrinter(IntPtr h, IntPtr p, int c, out int w);
  struct DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
  public static int Print(string n, byte[] d, string t) {
    IntPtr h;
    if (!OpenPrinter(n, out h, IntPtr.Zero)) {
      return -1; // OpenPrinter failed
    }
    try {
      var di = new DOCINFO { pDocName = "Receipt", pDataType = t };
      if (!StartDocPrinter(h, 1, ref di)) {
        return -2; // StartDocPrinter failed
      }
      var p = Marshal.AllocHGlobal(d.Length);
      Marshal.Copy(d, 0, p, d.Length);
      int w;
      var ok = WritePrinter(h, p, d.Length, out w);
      Marshal.FreeHGlobal(p);
      EndDocPrinter(h);
      if (!ok) return -3; // WritePrinter failed
      if (w != d.Length) return -4; // wrote partial
      return 1; // success
    } finally { ClosePrinter(h); }
  }
}
"@

# Test with different data types
$names = @($PrinterName, "EPSON TM-U220 Receipt")
$types = @("RAW", "TEXT")
foreach ($n in $names) {
  foreach ($t in $types) {
    $r = [RawPrinter2]::Print($n, [byte[]]@(0x54, 0x65, 0x73, 0x74, 0x0D, 0x0A), $t)
    Write-Output "Name='$n' Type=$t Result=$r"
  }
}

# Also try without DOCINFO - just use Out-Printer
Write-Output "---"
Write-Output "Testing Out-Printer..."
"Debug test from Out-Printer" | Out-Printer -Name "EPSON TM-U220 Receipt"
Write-Output "Out-Printer done"
