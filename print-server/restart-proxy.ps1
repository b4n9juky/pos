netstat -ano | Select-String ":8090 " | ForEach-Object {
  $t = $_.ToString().Trim() -split "\s+"
  Stop-Process -Id $t[-1] -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "C:\Users\yayas\Documents\Aplikasi\pos-rahmat\print-server"
Start-Sleep -Seconds 2
netstat -ano | Select-String ":8090 "
Write-Output "---"
try {
  $r = curl.exe -s http://localhost:8090/status
  Write-Output $r
} catch { Write-Output "Status check failed" }
