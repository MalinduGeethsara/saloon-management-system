#!/bin/bash
# Runs each scenario against a freshly restarted prod server (resets the in-memory login
# rate limiter and gives a clean memory baseline). SMS credentials are blanked so booking
# creation cannot send real Notify.lk texts to staff during the test.
cd "$(dirname "$0")"
ROOT="$(cd .. && pwd)"
mkdir -p results
: > runlog.txt

port_pid() {
  powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort $1 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess"
}

restart_server() {
  old=$(port_pid 3001 | tr -d '\r')
  [ -n "$old" ] && taskkill //F //T //PID "$old" > /dev/null 2>&1
  sleep 2
  (cd "$ROOT" && PORT=3001 NOTIFYLK_USER_ID= NOTIFYLK_API_KEY= npm run start > "$ROOT/load-testing/server.log" 2>&1 &)
  for i in $(seq 1 30); do
    curl -s -o /dev/null http://localhost:3001/ && break
    sleep 1
  done
}

for name in booking-read-3 booking-read-6 booking-read-10 dashboard reports payroll booking-write combined; do
  restart_server
  NODE_PID=$(port_pid 3001 | tr -d '\r')
  MYSQL_PID=$(port_pid 3306 | tr -d '\r')
  powershell -NoProfile -ExecutionPolicy Bypass -File monitor.ps1 -ProdPid "$NODE_PID" -MysqlPid "$MYSQL_PID" -OutFile "results/$name.perf.csv" -IntervalSec 2 &
  MON=$!
  echo "START $name $(date +%Y-%m-%dT%H:%M:%S) nodePid=$NODE_PID" >> runlog.txt
  artillery run "$name.yml" --output "results/$name.json" > "results/$name.txt" 2>&1
  echo "END   $name $(date +%Y-%m-%dT%H:%M:%S)" >> runlog.txt
  kill $MON 2>/dev/null
  sleep 3
done

echo "ALLDONE $(date +%Y-%m-%dT%H:%M:%S)" >> runlog.txt
