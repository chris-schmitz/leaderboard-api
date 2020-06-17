const express = require("express")
const app = express()
const path = require("path")
const bodyParser = require("body-parser") // * needed for post requests
const sqlite3 = require("sqlite3").verbose() // * needed for our data storage, specifically a sqlite database

const port = 3000
const dbPath = path.join(__dirname, "database", "leaderboard.db")
const db = new sqlite3.Database(dbPath)

// * Setting up a static path for hosting html files, assets, etc
app.use(express.static(path.join(__dirname, "public")))

// * Giving express the ability to read post body data in either json or url encoded formats
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// * Here's our post enpdoint
// ! note that there is no validation here, we're just grabbing the body data, submitting it, and returning success or fail
app.post("/score", async (request, response) => {
  try {
    const payload = request.body
    console.log(payload)

    await storeScore(payload.initials, payload.score)

    response.json({ succeful: true })
  } catch (error) {
    response.json({ succeful: false, error })
  }
})

app.get("/highscores", async (request, response) => {
  db.all(
    "SELECT initials, score FROM scores ORDER BY score DESC LIMIT 10",
    (error, rows) => {
      if (error) {
        console.log(error)
        response.json({ success: false, error })
      }
      console.log(rows)
      response.json({ success: true, scores: rows })
    }
  )
})

// * Hook into the given port
app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
)

// * === Database setup ===
// * If you need to change the schema definition you can do it here
db.run(
  "CREATE TABLE IF NOT EXISTS scores(id INTEGER PRIMARY KEY AUTOINCREMENT, initials TEXT NOT NULL, score INTEGER)"
)

// * here's our super simple store data function. we could add in stuff like validation and an abstraction layer
// * so we can submit different types of data for any number of tables, but this is the simple magic bullet implementation
function storeScore(initials, score) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      const statement = db.prepare(
        "INSERT INTO scores (initials, score) VALUES(?,?)"
      )

      statement.run([initials, score], (error) => {
        if (error) return reject(error)

        const recordId = statement.lastID
        console.log(`ENTRY WAS ADDED TO ROW: ${recordId}`)
        resolve(recordId)
      })

      statement.finalize()
    })
  })
}
