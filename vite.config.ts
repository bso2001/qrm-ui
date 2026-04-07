import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawnSync } from 'child_process'
import archiver from 'archiver'

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'qrm-generator',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/generate' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrm-gen-'));
              try {
                const json = JSON.parse(body);
                const inputJsonPath = path.join(tempDir, 'input.json');
                
                // Set the output directory for QRM to the temp dir
                json.outputDir = tempDir;
                fs.writeFileSync(inputJsonPath, JSON.stringify(json));
                
                const qrmMainPath = path.join(os.homedir(), 'src/qrm/main.js');
                const qrmDir = path.join(os.homedir(), 'src/qrm');
                
                console.log(`[QRM] Running generator: node ${qrmMainPath} ${inputJsonPath}`);
                const proc = spawnSync('node', [qrmMainPath, inputJsonPath], { 
                    cwd: qrmDir,
                    encoding: 'utf-8'
                });

                if (proc.status !== 0) {
                    throw new Error(proc.stderr || 'QRM generator failed');
                }

                // Gather MIDI files from the temp directory
                const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.mid'));
                if (files.length === 0) {
                    throw new Error('No MIDI files were generated');
                }

                console.log(`[QRM] Generated ${files.length} files. Zipping...`);
                
                // Setup ZIP stream
                const archive = archiver('zip', { zlib: { level: 9 } });
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename="${json.name || 'song'}.zip"`);
                
                archive.on('error', (err) => { throw err; });
                archive.pipe(res);

                for (const file of files) {
                    archive.file(path.join(tempDir, file), { name: file });
                }

                await archive.finalize();
                console.log(`[QRM] Generation and ZIP delivery complete.`);

              } catch (err) {
                console.error('[QRM] Generation Error:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              } finally {
                // Cleanup
                setTimeout(() => {
                    try {
                        if (fs.existsSync(tempDir)) {
                            fs.rmSync(tempDir, { recursive: true, force: true });
                        }
                    } catch (e) { console.error('Cleanup error:', e); }
                }, 5000); // Wait a bit for the stream to finish
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
