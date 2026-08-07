import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import type { Stats } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

let staticServer;
let staticServerPort;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8'
};

function isNotFoundError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT';
}

export async function setupStaticServer() {
  if (staticServer && staticServerPort) {
    return staticServerPort;
  }

  const rootDir = process.cwd();
  const allowedRoots = [
    join(rootDir, 'node_modules'),
    join(rootDir, 'dist'),
    join(rootDir, 'test', 'mock', 'pages')
  ];

  staticServer = createServer((req, res) => {
    void (async () => {
      const reqPath = req.url?.split('?')[0] || '/';
      const relativePath = reqPath === '/' ? '/test/mock/pages/' : reqPath;
      const normalizedPath = normalize(relativePath).replace(/^\.\.(\/|\\|$)+/, '');
      const absolutePath = join(rootDir, normalizedPath);

      if (!absolutePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      const isAllowedPath = allowedRoots.some((allowedRoot) => {
        return absolutePath === allowedRoot || absolutePath.startsWith(`${allowedRoot}${sep}`);
      });
      if (!isAllowedPath) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      try {
        await access(absolutePath);
      } catch (error) {
        if (isNotFoundError(error)) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }

      let fileStat: Stats;
      try {
        fileStat = await stat(absolutePath);
      } catch (error) {
        if (isNotFoundError(error)) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }

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
    })();
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
