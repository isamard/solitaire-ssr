import fs from 'node:fs/promises'
import express from 'express'
import sqlite3 from 'sqlite3'
import bodyParser from 'body-parser'

const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

// Create http server
const app = express()
app.use(bodyParser.json())
app.use(bodyParser.text())
//// FUNKCIJE TABLICE \\\\

const leaderboardDbPath = './sql/leaderboard.db'
const userDbPath = './sql/users.db'

/// Otvori bazu i napravi tablicu ako ne postoji
const openLeaderboardDb = () => {
  const db = new sqlite3.Database(leaderboardDbPath)
  db.serialize(() => {
    /* 
     * ime - text
     * pocetnovrijeme - početno vrijeme - '08:08' [hh, mm]
     * zavrsnovrijeme - završno vrijeme - '08:38' [hh, mm]
     * ukupnovrijeme - razlika između početnog i završnog vremena - '15:10' [mm, ss]
     * datum - datum igre - '05.03.2025.' [dd, mm, yyyy]
     * bodovi - bodovi postignuti u partiji - 33
    */
    db.run('CREATE TABLE IF NOT EXISTS scores (ime TEXT, pocetnovrijeme TEXT, zavrsnovrijeme TEXT, ukupnovrijeme TEXT, datum TEXT, bodovi INTEGER)')
  })
  return db
}

app.get('/api/queryleaderboarddb', (req, res) => {
  try {
    const db = openLeaderboardDb()

    db.all('SELECT * FROM scores', (_err, rows) => {
      res.json(rows)
    })

    db.close()
  } catch (e) {
    console.error('Leaderboard database Error:', e);
    res.status(500).json({ error: 'Database Error' });
  }
});

app.put('/api/writetoleaderboarddb', (req, res) => {
  try {
    const db = openLeaderboardDb()

    const { name, start_time, end_time, time, date, score } = req.body
    db.serialize(() => {
      db.run("INSERT INTO scores VALUES(?, ?, ?, ?, ?, ?)", name, start_time, end_time, time, date, score)
    })

    db.close()

  } catch (e) {
    console.error('Leaderboard database Error:', e);
    res.status(500).json({ error: 'Database Error' });
  }
})

//// FUNKCIJE KORISNIKA \\\\

const openUserDb = () => {
  const db = new sqlite3.Database(userDbPath)
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (name TEXT, password TEXT)')
  })
  return db
}

app.get('/api/queryusers', (req, res) => {
  try {
    const db = openUserDb()

    db.all('SELECT * FROM users', (_err, rows) => {
      res.json(rows)
    })

    db.close()
  } catch (e) {
    console.error('User database Error:', e);
    res.status(500).json({ error: 'Database Error' });
  }
});

app.put('/api/writetouserdb', (req, res) => {
  try {
    const db = openUserDb()

    const { name, password } = req.body

    console.log(`Wrote: ${name}, ${password}`)
    db.serialize(() => {
      db.run("INSERT INTO users VALUES(?, ?)", name, password)
    })

    db.close()

  } catch (e) {
    console.error('User database Error:', e);
    res.status(500).json({ error: 'Database Error' });
  }
})

let currentPlayer = '/'

app.get('/api/currentplayer', (req, res) => {
  console.log(`Getting ${currentPlayer}`)
  res.type('txt')
  res.send(currentPlayer)
})

app.put('/api/updatecurrentplayer', (req, res) => {
  currentPlayer = req.body
  console.log(`Putting ${currentPlayer}`)
})

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite
const { createServer } = await import('vite')
vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  base,
})
app.use(vite.middlewares)

// Serve HTML
app.use('/leaderboard', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    /** @type {string} */
    let template
    /** @type {import('./src/entry-leaderboard.ts').render} */
    let render
    // Always read fresh template in development
    template = await fs.readFile('./leaderboard.html', 'utf-8')
    template = await vite.transformIndexHtml(url, template)
    render = (await vite.ssrLoadModule('/src/entry-leaderboard.ts')).render

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


// Serve HTML
app.use('/home', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    /** @type {string} */
    let template
    /** @type {import('./src/entry-home.ts').render} */
    let render
    // Always read fresh template in development
    template = await fs.readFile('./index.html', 'utf-8')
    template = await vite.transformIndexHtml(url, template)
    render = (await vite.ssrLoadModule('/src/entry-home.ts')).render

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

app.use('/', async (req, res) => {
  res.redirect('/home')
})

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})



