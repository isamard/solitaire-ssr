import fs from 'node:fs/promises'
import express from 'express'
import sqlite3 from 'sqlite3'
import bodyParser from 'body-parser'

// Constants
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'
const dbPath = './sql/leaderboard.db'

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile('./dist/client/index.html', 'utf-8')
  : ''

// Create http server
const app = express()

/// Otvori bazu i napravi tablicu ako ne postoji
const openDatabase = () => {
  const db = new sqlite3.Database(dbPath)
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS scores (name TEXT, time TEXT)')
  })
  return db
}

app.use(bodyParser.json())

app.get('/api/querydb', (req, res) => {
  try {
    const db = openDatabase()

    db.all('SELECT * FROM scores', (_err, rows) => {
      res.json(rows)
    })

    db.close()
  } catch (e) {
    console.error('Database Error:', e);
    res.status(500).json({ error: 'Database Error' });
  }
});

app.put('/api/writetodb', (req, res) => {
  try {
    const db = openDatabase()

    const { name, time } = req.body

    db.serialize(() => {
      db.run("INSERT INTO scores VALUES(?, ?)", name, time)
    })

    db.close()

  } catch (e) {
    console.error('Database Error:', e);
    res.status(500).json({ error: 'Database Error' });
  }
})

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite
if (!isProduction) {
  const { createServer } = await import('vite')
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })
  app.use(vite.middlewares)
} else {
  const compression = (await import('compression')).default
  const sirv = (await import('sirv')).default
  app.use(compression())
  app.use(base, sirv('./dist/client', { extensions: [] }))
}

// Serve HTML
app.use('/', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    /** @type {string} */
    let template
    /** @type {import('./src/entry-server.ts').render} */
    let render
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile('./index.html', 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      render = (await vite.ssrLoadModule('/src/entry-server.ts')).render
    } else {
      template = templateHtml
      render = (await import('./dist/server/entry-server.js')).render
    }

    const rendered = await render(url)

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '')

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html)
  } catch (e) {
    vite?.ssrFixStacktrace(e)
    console.log(e.stack)
    res.status(500).end(e.stack)
  }
})

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})



