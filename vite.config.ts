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

                // Parse the request to intercept and fix outputDir
                const json = JSON.parse(body);
                if (json.outputDir) {
                  // Resolve relative paths against the UI project directory
                  const absoluteOutDir = path.resolve(process.cwd(), json.outputDir);
                  json.outputDir = absoluteOutDir;
                  
                  // Ensure the output directory exists so the generator doesn't crash
                  if (!fs.existsSync(absoluteOutDir)) {
                    fs.mkdirSync(absoluteOutDir, { recursive: true });
                    console.log(`[QRM] Created output directory: ${absoluteOutDir}`);
                  }
                }

                const filename = `request_${Date.now()}.json`;
                const filePath = path.join(spoolDir, filename);
                fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
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
