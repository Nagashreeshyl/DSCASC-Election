#!/usr/bin/env bash
set -u
cd /Users/mymacbook/projects/DSCASC-Election

./node_modules/.bin/firebase emulators:start --only auth,firestore --project voting-d984b > /tmp/em.log 2>&1 &
EM=$!

NEXT_PUBLIC_USE_EMULATORS=true npm run dev > /tmp/dev.log 2>&1 &
DEV=$!

wait_for() {
  local p=$1
  for i in $(seq 1 120); do
    (exec 3<>/dev/tcp/127.0.0.1/$p) 2>/dev/null && return 0
    sleep 1
  done
  return 1
}

echo "waiting for emulators + dev server..."
wait_for 9099 && echo "auth up" || echo "auth DOWN"
wait_for 8080 && echo "firestore up" || echo "firestore DOWN"
wait_for 3000 && echo "next up" || echo "next DOWN"
sleep 5

node tests/e2e.mjs
RC=$?
kill $EM $DEV 2>/dev/null
exit $RC
