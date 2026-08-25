Get-NetTCPConnection -LocalPort 3000,4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
    if ($_ -gt 0) {
        Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
    }
}
