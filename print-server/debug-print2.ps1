Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter3 {
  [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
  static extern bool OpenPrinter(string p, out IntPtr h, ref PRINTER_DEFAULTS d);
  [DllImport("winspool.drv")] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode)]
  static extern bool StartDocPrinter(IntPtr h, int l, ref DOCINFO d);
  [DllImport("winspool.drv")] static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv")] static extern bool WritePrinter(IntPtr h, IntPtr p, int c, out int w);
  [DllImport("kernel32.dll")] static extern int GetLastError();

  struct PRINTER_DEFAULTS {
    public IntPtr pDatatype;
    public IntPtr pDevMode;
    public int DesiredAccess;
  }
  struct DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }

  public static int PrintFull(string n, byte[] d, string t) {
    PRINTER_DEFAULTS pd = new PRINTER_DEFAULTS();
    pd.DesiredConstraints = 0;
    
    IntPtr h;
    if (!OpenPrinter(n, out h, ref pd)) return -100 - GetLastError();
    
    int level = 1;
    DOCINFO di = new DOCINFO { pDocName = "Receipt", pDataType = t };
    if (!StartDocPrinter(h, level, ref di)) {
      int err = GetLastError();
      ClosePrinter(h);
      return -200 - err;
    }
    var p = Marshal.AllocHGlobal(d.Length);
    Marshal.Copy(d, 0, p, d.Length);
    int w;
    bool ok = WritePrinter(h, p, d.Length, out w);
    int err2 = ok ? 0 : GetLastError();
    Marshal.FreeHGlobal(p);
    EndDocPrinter(h);
    ClosePrinter(h);
    if (!ok) return -300 - err2;
    if (w != d.Length) return -400;
    return 1;
  }

  public static int TestOpen(string n) {
    PRINTER_DEFAULTS pd = new PRINTER_DEFAULTS();
    pd.DesiredConstraints = 0;
    IntPtr h;
    if (OpenPrinter(n, out h, ref pd)) { ClosePrinter(h); return 1; }
    return -GetLastError();
  }
}
"@

Write-Output "=== Test OpenPrinter ==="
$r = [RawPrinter3]::TestOpen("EPSON TM-U220 Receipt")
Write-Output "OpenPrinter: $r"

Write-Output "=== Test Full Print ==="
$data = [System.Text.Encoding]::ASCII.GetBytes("Test line 1`r`nTest line 2`r`n`r`n`r`n")
$r = [RawPrinter3]::PrintFull("EPSON TM-U220 Receipt", $data, "RAW")
Write-Output "Result: $r"

# Try with explicit printer defaults
Write-Output "=== Test Full Print (TEXT) ==="
$r = [RawPrinter3]::PrintFull("EPSON TM-U220 Receipt", $data, "TEXT")
Write-Output "Result: $r"
