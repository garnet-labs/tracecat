// Runs after the Garnet post step (post steps run in reverse order), so the
// sensor has already stopped. Output is bounded: counts, sizes and short lines.
const { execSync } = require("node:child_process")

const script = `
set +e
L=/var/log/jibril.log
echo "--- files after stop"
sudo ls -la /var/log/ | grep jibril
echo "--- audit lines after stop"
sudo wc -l /var/log/jibril.out
echo "--- dispatcher and pool lines"
sudo grep -a -E "enqueued jobs|forcefully shutting down|dispatcher shutdown complete|thread pool stopped|discarded [0-9]+ queued" $L | cut -c1-240 | tail -12
echo "--- profile lines"
sudo grep -a -E "profile sending event|profile sent with success|failed to create profile" $L | cut -c1-240 | tail -6
echo "--- failed event uploads (count, first, last)"
sudo grep -a -c "failed to ingest v2 event" $L
sudo grep -a "failed to ingest v2 event" $L | cut -c1-300 | sed -E 's/eyJ[A-Za-z0-9_.-]+/[redacted]/g' | sed -n '1p;$p'
echo "--- last plain log lines"
sudo grep -a -E "^[^ {}\\"]*(INFO|WARN|ERROR|info|warn|error)" $L | cut -c1-240 | sed -E 's/eyJ[A-Za-z0-9_.-]+/[redacted]/g' | tail -25
`

try {
    process.stdout.write(execSync(script, { shell: "/bin/bash", encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }))
} catch (error) {
    console.log(`sensor-diag skipped: ${error.message.slice(0, 300)}`)
}
