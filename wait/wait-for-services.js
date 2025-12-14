// wait-for-services.js
// Node script to wait for multiple TCP services to become reachable.
// It connects to provided host:port targets until all are reachable or timeout.

const net = require("net");

const targets = [
  {
    name: "backend",
    host: process.env.BACKEND_HOST || "be-pss-app",
    port: parseInt(process.env.BACKEND_PORT || "8000"),
  },
  {
    name: "mysql",
    host: process.env.DATABASE_HOST || "db-pss-app",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
  },
  {
    name: "mongo",
    host: process.env.MONGO_HOST || "db-mongo-pss-app",
    port: parseInt(process.env.MONGO_PORT || "27017"),
  },
];

const intervalMs = parseInt(process.env.WAIT_INTERVAL_MS || "1000");
const maxAttempts = parseInt(process.env.WAIT_MAX_ATTEMPTS || "300"); // default 5 minutes

function checkTcp(host, port, timeout = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    socket.setTimeout(timeout);
    socket.once("error", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.once("timeout", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });
    socket.connect(port, host, () => {
      if (!settled) {
        settled = true;
        socket.end();
        resolve(true);
      }
    });
  });
}

async function waitAll() {
  console.log("Waiting for services to become available:");
  targets.forEach((t) => console.log(`  - ${t.name}: ${t.host}:${t.port}`));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const results = await Promise.all(
      targets.map((t) => checkTcp(t.host, t.port))
    );
    const okCount = results.filter(Boolean).length;
    if (okCount === targets.length) {
      console.log(`All services reachable (attempt ${attempt}). Proceeding.`);
      return 0;
    }

    if (attempt % 10 === 0) {
      console.log(
        `Attempt ${attempt}: ${okCount}/${targets.length} services reachable.`
      );
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  console.error(`Timeout waiting for services after ${maxAttempts} attempts.`);
  return 2;
}

waitAll().then((code) => process.exit(code));
