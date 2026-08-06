import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

let staticServer;
let staticServerPort;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8'
};

export async function setupStaticServer() {
  if (staticServer && staticServerPort) {
    return staticServerPort;
  }

  const rootDir = process.cwd();

  staticServer = createServer((req, res) => {
    const reqPath = req.url?.split('?')[0] || '/';
    const relativePath = reqPath === '/' ? '/test/mock/pages/' : reqPath;
    const normalizedPath = normalize(relativePath).replace(/^\.\.(\/|\\|$)+/, '');
    const absolutePath = join(rootDir, normalizedPath);

    if (!absolutePath.startsWith(rootDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!existsSync(absolutePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const fileStat = statSync(absolutePath);
    if (fileStat.isDirectory()) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const extension = extname(absolutePath);
    const contentType = contentTypes[extension] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });

    createReadStream(absolutePath).pipe(res);
  });

  await new Promise((resolve, reject) => {
    staticServer.once('error', reject);
    staticServer.listen(0, '127.0.0.1', () => {
      const address = staticServer.address();
      staticServerPort = typeof address === 'object' && address ? address.port : undefined;
      resolve(staticServerPort);
    });
  });

  return staticServerPort;
}

export async function closeStaticServer() {
  if (!staticServer) return;

  await new Promise((resolve, reject) => {
    staticServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(undefined);
    });
  });

  staticServer = undefined;
  staticServerPort = undefined;
}
