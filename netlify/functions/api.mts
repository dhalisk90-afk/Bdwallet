import type { Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import type { AddressInfo } from 'net';

// Runs the existing Express API (server.ts) on Netlify. The JSON database is kept
// in Netlify Blobs so users, records and sessions survive across function invocations.

process.env.BDW_SERVERLESS = 'true';
process.env.BDW_DATA_ROOT = process.env.BDW_DATA_ROOT || '/tmp/bdwallet';

const DB_KEY = 'bd_wallet_db';

type Server = { baseUrl: string; db: typeof import('../../server/db.js')['dbInstance'] };

let serverPromise: Promise<Server> | null = null;

function startServer(): Promise<Server> {
  if (!serverPromise) {
    serverPromise = (async () => {
      const [{ app }, { dbInstance }] = await Promise.all([
        import('../../server.js'),
        import('../../server/db.js'),
      ]);
      const listener = await new Promise<import('http').Server>((resolve) => {
        const s = app.listen(0, '127.0.0.1', () => resolve(s));
      });
      const { port } = listener.address() as AddressInfo;
      return { baseUrl: `http://127.0.0.1:${port}`, db: dbInstance };
    })();
  }
  return serverPromise;
}

// Requests are handled one at a time per instance so the load → handle → save cycle stays consistent
let queue: Promise<unknown> = Promise.resolve();

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

export default async (req: Request) => {
  const { baseUrl, db } = await startServer();
  const store = getStore({ name: 'bd-wallet', consistency: 'strong' });
  const url = new URL(req.url);
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('content-length');

  return serialize(async () => {
    const stored = await store.get(DB_KEY, { type: 'json' });
    if (stored) {
      db.loadState(stored);
    } else {
      // First run: persist the freshly seeded database
      await store.setJSON(DB_KEY, db.exportDatabase());
      db.loadState(db.exportDatabase());
    }

    try {
      db.checkAndResetMonthlyLimits();
    } catch (err) {
      console.error('[BD Wallet] Monthly limit check error:', err);
    }

    const res = await fetch(`${baseUrl}${url.pathname}${url.search}`, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });
    const resBody = await res.arrayBuffer();

    const changed = db.takeDirtyState();
    if (changed) {
      await store.setJSON(DB_KEY, changed);
    }

    const resHeaders = new Headers(res.headers);
    resHeaders.delete('content-encoding');
    resHeaders.delete('content-length');
    resHeaders.delete('transfer-encoding');
    resHeaders.delete('connection');
    return new Response(resBody, { status: res.status, headers: resHeaders });
  });
};

export const config: Config = {
  path: ['/api/*', '/uploads/*'],
};
