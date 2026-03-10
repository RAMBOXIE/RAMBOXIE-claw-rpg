import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/character', (_req, res) => {
  const file = join(ROOT, 'character.json');
  if (!existsSync(file)) {
    return res.status(404).json({ error: 'No character found. Run: node scripts/init.mjs' });
  }
  res.json(JSON.parse(readFileSync(file, 'utf8')));
});

app.get('/api/arena', (_req, res) => {
  const file = join(ROOT, 'arena-history.json');
  res.json(existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []);
});

app.use(express.static(join(__dirname, 'dist')));
app.get('/{*path}', (_req, res) => {
  const idx = join(__dirname, 'dist', 'index.html');
  if (existsSync(idx)) return res.sendFile(idx);
  res.send('<pre>Run: npm run build\nThen: npm start</pre>');
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`\n🦞 Claw RPG Dashboard → http://localhost:${PORT}\n`);
});
