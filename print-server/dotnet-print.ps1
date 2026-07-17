param($PrinterName, $TextContent)

Add-Type -AssemblyName System.Drawing

$doc = New-Object System.Drawing.Printing.PrintDocument
$doc.PrinterSettings.PrinterName = $PrinterName

# Set paper size to 80mm x 297mm (receipt size)
$pw = [System.Drawing.Printing.PaperSize]::new("Receipt", 315, 11693) # 80mm=315mil, 297mm=11693mil
$doc.DefaultPageSettings.PaperSize = $pw
$doc.DefaultPageSettings.Margins = [System.Drawing.Printing.Margins]::new(0, 0, 0, 0)

$lines = $TextContent -split "`r`n" | ForEach-Object { $_ -replace "`r", "" -replace "`n", "" }
$index = 0
$font = New-Object System.Drawing.Font("Courier New", 8, [System.Drawing.FontStyle]::Regular)
$brush = [System.Drawing.Brushes]::Black

Register-ObjectEvent -InputObject $doc -EventName PrintPage -Action {
  $y = 0
  while ($index -lt $lines.Length -and $y -lt $doc.DefaultPageSettings.PaperSize.Height - 20) {
    $line = $lines[$index]
    $doc.Graphics.DrawString($line, $font, $brush, 0, $y)
    $y += 10  # line spacing
    $index++
  }
  $event.MessageData.HasMorePages = $index -lt $lines.Length
} | Out-Null

$hasMorePages = $true
$doc.Print()
