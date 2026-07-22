param([int]$Port = 8090)

$ErrorActionPreference = "Stop"

# ─── C# Raw Printer (winspool.drv WritePrinter) ───
$RAW_PRINT_CS = @'
using System;
using System.Runtime.InteropServices;
public class RawPrinter {
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern bool OpenPrinter(string p, out IntPtr h, IntPtr d);
  [DllImport("winspool.drv")] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern int StartDocPrinter(IntPtr h, int l, ref DOCINFO d);
  [DllImport("winspool.drv")] static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv")] static extern bool WritePrinter(IntPtr h, IntPtr p, int c, out int w);
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }
  public static void Print(string n, byte[] d, string t) {
    IntPtr h;
    if (!OpenPrinter(n, out h, IntPtr.Zero)) throw new Exception("E_OPEN:" + Marshal.GetLastWin32Error());
    try {
      var di = new DOCINFO { pDocName = "Receipt", pDataType = t };
      if (StartDocPrinter(h, 1, ref di) == 0) throw new Exception("E_STARTDOC:" + Marshal.GetLastWin32Error());
      var p = Marshal.AllocHGlobal(d.Length);
      Marshal.Copy(d, 0, p, d.Length);
      int w;
      if (!WritePrinter(h, p, d.Length, out w)) { int e = Marshal.GetLastWin32Error(); Marshal.FreeHGlobal(p); EndDocPrinter(h); throw new Exception("E_WRITE:" + e); }
      if (w != d.Length) { Marshal.FreeHGlobal(p); EndDocPrinter(h); throw new Exception("E_SHORT:" + w); }
      Marshal.FreeHGlobal(p);
      EndDocPrinter(h);
    } finally { ClosePrinter(h); }
  }
}
'@
Add-Type -TypeDefinition $RAW_PRINT_CS

# ─── ESC/POS builder ───
$ENC = [System.Text.Encoding]::GetEncoding(850)  # CP850

function InitPrinter {
  $b = New-Object System.Collections.Generic.List[byte]
  $b.Add(0x1B); $b.Add(0x74); $b.Add(0x02)  # ESC t 2  Code page PC850
  return ,$b
}

function AddText([System.Collections.Generic.List[byte]]$b, $s) {
  if ([string]::IsNullOrEmpty($s)) { return }
  $bytes = $ENC.GetBytes($s)
  $b.AddRange($bytes)
}

function AddLine([System.Collections.Generic.List[byte]]$b, $s) {
  AddText $b $s
  AddLf $b
}

function AddLf([System.Collections.Generic.List[byte]]$b) {
  $b.Add(0x0A)  # LF
}

function SetAlign([System.Collections.Generic.List[byte]]$b, $n) {
  $b.Add(0x1B); $b.Add(0x61); $b.Add($n)  # ESC a n
}

function SetBold([System.Collections.Generic.List[byte]]$b, $on) {
  $b.Add(0x1B); $b.Add(0x45); if ($on) { $b.Add(0x01) } else { $b.Add(0x00) }  # ESC E n
}

function DrawLine([System.Collections.Generic.List[byte]]$b, $ch, $len) {
  AddLine $b ($ch * $len)
}

function LeftRight([System.Collections.Generic.List[byte]]$b, $left, $right, $w) {
  $pad = $w - $left.Length - $right.Length
  AddText $b $left
  if ($pad -gt 0) { AddText $b (" " * $pad) }
  AddLine $b $right
}

function Fmt($n) {
  if ($null -eq $n) { return "0" }
  return ([double]$n).ToString("N0").Replace(",", ".")
}

function GetWidth($paperWidth) {
  if ($paperWidth -ge 80) { return 48 }
  if ($paperWidth -ge 76) { return 42 }
  return 40
}

function BuildReceiptBytes($data) {
  $paperWidth = if ($data.paperWidth) { $data.paperWidth } else { 58 }
  $autoCut = if ($null -ne $data.autoCut) { $data.autoCut } else { $true }

  $W = GetWidth $paperWidth
  $cItem = [Math]::Floor($W * 0.38)
  $cPrice = [Math]::Floor($W * 0.18)
  $cQty = [Math]::Floor($W * 0.12)
  $cSub = $W - $cItem - $cPrice - $cQty - 5

  $b = InitPrinter

  # Header
  SetAlign $b 1
  SetBold $b $true
  AddLine $b $(if ($data.storeName) { $data.storeName } else { "My Store" })
  SetBold $b $false
  if ($data.storeAddress) { AddLine $b $data.storeAddress }
  if ($data.storePhone) { AddLine $b ("Tel: " + $data.storePhone) }
  $now = if ($data.date) { Get-Date $data.date } else { Get-Date }
  AddLine $b ($now.ToString("dd/MM/yyyy HH.mm"))
  AddLine $b $data.orderNumber

  SetAlign $b 0
  DrawLine $b "-" $W

  if ($data.customerName) {
    AddLine $b $data.customerName
    DrawLine $b "-" $W
  }

  # Column headers
  SetBold $b $true
  $hdr = "ITEM".PadRight($cItem) + " " + "PRICE".PadLeft($cPrice) + " " + "QTY".PadLeft($cQty) + " " + "SUBTOTAL".PadLeft($cSub)
  AddLine $b $hdr
  SetBold $b $false
  DrawLine $b "-" $W

  # Items
  foreach ($item in $data.items) {
    $iname = $item.name
    if ($iname.Length -gt $cItem) { $iname = $iname.Substring(0, $cItem) }
    AddLine $b ($iname.PadRight($cItem) + " " + (Fmt $item.price).PadLeft($cPrice) + " " + "$($item.quantity)".PadLeft($cQty) + " " + (Fmt $item.subtotal).PadLeft($cSub))
  }

  DrawLine $b "-" $W

  # Totals
  LeftRight $b "TOTAL" (Fmt $data.total) $W
  if ($data.paymentMethod -eq "cash") {
    if ($null -ne $data.amountPaid) { LeftRight $b "TUNAI" (Fmt $data.amountPaid) $W }
    if ($null -ne $data.change) { LeftRight $b "KEMBALI" (Fmt $data.change) $W }
  } else {
    LeftRight $b "TUNAI" (Fmt $data.total) $W
    LeftRight $b "KEMBALI" "0" $W
  }
  if ($data.discount -gt 0) { LeftRight $b "DISKON" (Fmt $data.discount) $W }

  AddLf $b

  if ($data.cashierName) {
    AddLine $b ("KASIR: " + $data.cashierName)
  }

  DrawLine $b "-" $W

  if ($data.receiptFooter) {
    SetAlign $b 1
    AddLine $b $data.receiptFooter
  }

  AddLf $b
  AddLf $b
  AddLf $b

  if ($autoCut) {
    $b.Add(0x1B); $b.Add(0x64); $b.Add(0x04)  # ESC d 04  Vertical tab
    $b.Add(0x1B); $b.Add(0x64); $b.Add(0x04)  # ESC d 04  Vertical tab
    $b.Add(0x1D); $b.Add(0x56); $b.Add(0x00)  # GS V 0    Full cut
    $b.Add(0x1B); $b.Add(0x40)                  # ESC @     Initialize printer
  }
  $b.Add(0x1B); $b.Add(0x70); $b.Add(0x00)    # ESC p 0   Cash drawer pin 2
  $b.Add(0x1B); $b.Add(0x70); $b.Add(0x01)    # ESC p 1   Cash drawer pin 5

  return $b.ToArray()
}

function SendToPrinter($bytes, $printerName) {
  [RawPrinter]::Print($printerName, $bytes, "RAW")
}

# ─── HTTP server ───
function SendJson($context, $json, $status = 200) {
  $context.Response.StatusCode = $status
  $context.Response.ContentType = "application/json"
  $context.Response.Headers["Access-Control-Allow-Origin"] = "*"
  $context.Response.Headers["Access-Control-Allow-Private-Network"] = "true"
  $buf = [System.Text.Encoding]::UTF8.GetBytes($json)
  $context.Response.ContentLength64 = $buf.Length
  $context.Response.OutputStream.Write($buf, 0, $buf.Length)
  $context.Response.Close()
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
  $listener.Start()
} catch {
  Write-Host "ERROR: Could not start listener on port $Port."
  Write-Host "Port $Port may already be in use. Check with: netstat -ano | findstr :$Port"
  Write-Host "Or try a different port: .\agent.ps1 -Port 8091"
  pause
  exit 1
}

Write-Host ""
Write-Host "  POS Print Agent (ESC/POS) running on port $Port"
Write-Host "  " ("-" * 45)
Write-Host "  Status:       GET http://localhost:$Port/status"
Write-Host "  Detect:       GET http://localhost:$Port/detect"
Write-Host "  Print:       POST http://localhost:$Port/print"
Write-Host "  Test Print:  POST http://localhost:$Port/test"
Write-Host "  " ("-" * 45)
Write-Host "  Press Ctrl+C to stop."
Write-Host ""

while ($true) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $path = $req.Url.AbsolutePath
    $method = $req.HttpMethod

    if ($method -eq "OPTIONS") {
      $ctx.Response.Headers["Access-Control-Allow-Origin"] = "*"
      $ctx.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
      $ctx.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type"
      $ctx.Response.Headers["Access-Control-Allow-Private-Network"] = "true"
      $ctx.Response.StatusCode = 204
      $ctx.Response.Close()
      continue
    }

    switch ("$method $path") {
      "GET /status" {
        SendJson $ctx (@{status="running"; version="2.0.0"; port=$Port; escpos=$true} | ConvertTo-Json -Compress)
      }
      "GET /detect" {
        $printers = @(Get-Printer | Select-Object -ExpandProperty Name)
        SendJson $ctx (@{printers=$printers} | ConvertTo-Json -Compress)
      }
      "POST /print" {
        $reader = New-Object System.IO.StreamReader($req.InputStream)
        $json = $reader.ReadToEnd()
        $reader.Close()
        $data = $json | ConvertFrom-Json

        if (-not $data.printerName) {
          SendJson $ctx (@{error="printerName is required"} | ConvertTo-Json -Compress) 400
          continue
        }

        $bytes = BuildReceiptBytes $data
        SendToPrinter $bytes $data.printerName
        Write-Host "  [$(Get-Date -Format HH:mm:ss)] Printed $($data.orderNumber) on $($data.printerName)"
        SendJson $ctx (@{success=$true} | ConvertTo-Json -Compress)
      }
      "POST /test" {
        $reader = New-Object System.IO.StreamReader($req.InputStream)
        $json = $reader.ReadToEnd()
        $reader.Close()
        $data = $json | ConvertFrom-Json

        if (-not $data.printerName) {
          SendJson $ctx (@{error="printerName is required"} | ConvertTo-Json -Compress) 400
          continue
        }

        $testData = [PSCustomObject]@{
          printerName = $data.printerName
          storeName = "RAHMAT TOYS"
          storeAddress = "Jl. A. Yani No 21"
          storePhone = "08767654332"
          receiptFooter = "Terima kasih!"
          orderNumber = "TEST-001"
          date = (Get-Date).ToString("o")
          items = @(
            [PSCustomObject]@{name="Mainan Edukasi"; quantity=2; price=25000; subtotal=50000}
            [PSCustomObject]@{name="Boneka Kecil"; quantity=1; price=15000; subtotal=15000}
          )
          subtotal = 65000
          tax = 6500
          discount = 5000
          total = 66500
          paymentMethod = "cash"
          amountPaid = 100000
          change = 33500
          paperWidth = if ($data.paperWidth) { $data.paperWidth } else { 58 }
          autoCut = $true
        }

        $bytes = BuildReceiptBytes $testData
        SendToPrinter $bytes $data.printerName
        Write-Host "  [$(Get-Date -Format HH:mm:ss)] Test print sent to $($data.printerName)"
        SendJson $ctx (@{success=$true} | ConvertTo-Json -Compress)
      }
      "POST /diagnose" {
        $reader = New-Object System.IO.StreamReader($req.InputStream)
        $json = $reader.ReadToEnd()
        $reader.Close()
        $data = $json | ConvertFrom-Json

        if (-not $data.printerName) {
          SendJson $ctx (@{error="printerName is required"} | ConvertTo-Json -Compress) 400
          continue
        }

        $bytes = BuildReceiptBytes $data
        $hex = [System.BitConverter]::ToString($bytes) -replace '-', ''
        $ascii = [System.Text.Encoding]::ASCII.GetString($bytes) -replace '[^\x20-\x7E]', '.'

        SendJson $ctx (@{hex=$hex; length=$bytes.Length; ascii=$ascii} | ConvertTo-Json -Compress)
      }
      default {
        SendJson $ctx (@{error="Not found"} | ConvertTo-Json -Compress) 404
      }
    }
  } catch {
    Write-Host "  [ERROR] $($_.Exception.Message)"
    try {
      $ctx.Response.Headers["Access-Control-Allow-Origin"] = "*"
      $ctx.Response.Headers["Access-Control-Allow-Private-Network"] = "true"
      $ctx.Response.StatusCode = 500
      $errMsg = $_.Exception.Message.Replace('"', '\"')
      $buf = [System.Text.Encoding]::UTF8.GetBytes("{""error"":""$errMsg""}")
      $ctx.Response.ContentType = "application/json"
      $ctx.Response.ContentLength64 = $buf.Length
      $ctx.Response.OutputStream.Write($buf, 0, $buf.Length)
      $ctx.Response.Close()
    } catch {}
  }
}

$listener.Stop()
$listener.Close()
