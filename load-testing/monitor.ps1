param(
  [int]$ProdPid,
  [int]$MysqlPid,
  [string]$OutFile = "perf.csv",
  [int]$IntervalSec = 2
)

"timestamp,node_ws_mb,node_private_mb,node_cpu_s,mysql_ws_mb,mysql_private_mb,mysql_cpu_s" | Out-File -FilePath $OutFile -Encoding ascii

while ($true) {
  $n = Get-Process -Id $ProdPid -ErrorAction SilentlyContinue
  $m = Get-Process -Id $MysqlPid -ErrorAction SilentlyContinue
  if (-not $n -or -not $m) { break }
  $ts = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fff"
  $line = "{0},{1},{2},{3},{4},{5},{6}" -f `
    $ts,
    [math]::Round($n.WorkingSet64 / 1MB, 1),
    [math]::Round($n.PrivateMemorySize64 / 1MB, 1),
    [math]::Round($n.TotalProcessorTime.TotalSeconds, 2),
    [math]::Round($m.WorkingSet64 / 1MB, 1),
    [math]::Round($m.PrivateMemorySize64 / 1MB, 1),
    [math]::Round($m.TotalProcessorTime.TotalSeconds, 2)
  $line | Out-File -FilePath $OutFile -Append -Encoding ascii
  Start-Sleep -Seconds $IntervalSec
}
