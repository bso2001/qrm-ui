import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import fs from 'fs'
import path from 'path'
import os from 'os'

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'qrm-spooler',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/generate' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const spoolDir = path.join(os.homedir(), 'src/qrm/spool');
                if (!fs.existsSync(spoolDir)) {
                  fs.mkdirSync(spoolDir, { recursive: true });
                }
                const filename = `request_${Date.now()}.json`;
                const filePath = path.join(spoolDir, filename);
                fs.writeFileSync(filePath, body);
                console.log(`[QRM] Spooled request to ${filePath}`);
                res.statusCode = 200;
                res.end('OK');
              } catch (err) {
                console.error('[QRM] Failed to spool request:', err);
                res.statusCode = 500;
                res.end('Error');
              }
            });
          } else {
            next();
          }
        });
      }
    }
  ],
})
