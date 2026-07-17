param($PrinterName, $TextFile)

Add-Type -AssemblyName System.Drawing

$text = [System.IO.File]::ReadAllText($TextFile, [System.Text.Encoding]::UTF8)
$allLines = $text -split "`r`n"

$doc = New-Object System.Drawing.Printing.PrintDocument
$doc.PrinterSettings.PrinterName = $PrinterName
$doc.DocumentName = "Receipt"

$doc.DefaultPageSettings.Margins = [System.Drawing.Printing.Margins]::new(0, 5, 0, 0)

$paper = New-Object System.Drawing.Printing.PaperSize("Receipt", 299, 196850)
$doc.DefaultPageSettings.PaperSize = $paper

$centerFmt = New-Object System.Drawing.StringFormat
$centerFmt.Alignment = [System.Drawing.StringAlignment]::Center
$centerFmt.LineAlignment = [System.Drawing.StringAlignment]::Near

$leftFmt = New-Object System.Drawing.StringFormat
$leftFmt.Alignment = [System.Drawing.StringAlignment]::Near
$leftFmt.LineAlignment = [System.Drawing.StringAlignment]::Near

$doc.add_PrintPage({
  param($sender, $e)
  $pw = $e.PageBounds.Width
  if ($pw -le 0) { $pw = 280 }

  # Determine W from the first separator line (===...)
  $wVal = 42
  foreach ($ln in $allLines) {
    $t = $ln.Trim()
    if ($t.Length -gt 0 -and $t -match '^[=-]+$') {
      $wVal = $t.Length
      break
    }
  }

  # Font size to fit W chars in printable width
  $fs = $pw / ($wVal * 0.6) * 72 / 100
  if ($fs -gt 9) { $fs = 9 }
  if ($fs -lt 5.5) { $fs = 5.5 }

  $font = New-Object System.Drawing.Font("Courier New", [single]$fs)
  $brush = [System.Drawing.Brushes]::Black
  $lineH = [single]($fs * 1.5)
  $centerX = [int]($pw / 2)

  for ($i = 0; $i -lt $allLines.Length; $i++) {
    $line = $allLines[$i]
    if ($line.Length -eq 0) { continue }

    $y = [int]($i * $lineH)
    $trimmed = $line.TrimEnd()

    $isCenter = $line.StartsWith(" ") -and $line.EndsWith(" ") -and $trimmed.Trim().Length -gt 0

    if ($isCenter) {
      $e.Graphics.DrawString($trimmed.Trim(), $font, $brush, $centerX, $y, $centerFmt)
    } else {
      $e.Graphics.DrawString($line, $font, $brush, 0, $y, $leftFmt)
    }
  }
  $e.HasMorePages = $false
})

try {
  $doc.Print()
  Write-Output "PRINT_OK"
} catch {
  Write-Output "PRINT_FAIL:$($_.Exception.Message)"
}
