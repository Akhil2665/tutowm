const express = require('express')
const {open} = require('sqlite')
const path = require('path')
const app = express()

app.use(express.json())

const sqlite3 = require('sqlite3')
let db = null

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

const convertToCamelCasePlayerDetails = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const initializeTheServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running.....')
    })
  } catch (err) {
    console.log(`error message: ${err.message}`)
    process.exit(1)
  }
}

initializeTheServer()

const convertToCamelCaseMatchDetails = dbMatchObject => {
  return {
    matchId: dbMatchObject.match_id,
    match: dbMatchObject.match,
    year: dbMatchObject.year,
  }
}

const convertToCamelCaseMatchScoreDetails = dbScoreObject => {
  return {
    playerMatchId: dbScoreObject.player_match_id,
    playerId: dbScoreObject.player_id,
    matchId: dbScoreObject.match_id,
    score: dbScoreObject.score,
    fours: dbScoreObject.fours,
    sixes: dbScoreObject.sixes,
  }
}

// getting players data API

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`
  const dbResponse = await db.all(getPlayersQuery)
  response.send(
    dbResponse.map(eachObject => convertToCamelCasePlayerDetails(eachObject)),
  )
})

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`
  const dbResponse = await db.get(getPlayerQuery)
  response.send(convertToCamelCasePlayerDetails(dbResponse))
})

// 3rd API
app.put('/players/:playerId/', async (request, response) => {
  const {playerName} = request.body
  const {playerId} = request.params
  const getPlayerQuery = `UPDATE
         player_details
       SET  
        player_name = '${playerName}'
       WHERE player_id = ${playerId};`
  const dbResponse = await db.run(getPlayerQuery)
  response.send('Player Details Updated')
})

//get match details by matchId API

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getPlayersQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`
  const dbResponse = await db.get(getPlayersQuery)
  response.send(convertToCamelCaseMatchDetails(dbResponse))
})

// Returns a list of all the matches of a player --5th API

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getPlayersQuery = `SELECT *
    FROM player_match_score
    NATURAL JOIN match_details 
    WHERE player_id = ${playerId};`

  const dbResponse = await db.all(getPlayersQuery)
  response.send(
    dbResponse.map(eachObject => convertToCamelCaseMatchDetails(eachObject)),
  )
})

//6th API

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersQuery = `SELECT player_details.player_id,
    player_details.player_name
    FROM player_details 
    INNER JOIN player_match_score 
    ON player_details.player_id = player_match_score.player_id 
    WHERE match_id = ${matchId};`
  const dbResponse = await db.all(getPlayersQuery)
  response.send(
    dbResponse.map(eachObject => convertToCamelCasePlayerDetails(eachObject)),
  )
})

//7th-Api --Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayersQuery = `SELECT pd.player_id AS playerId,
    pd.player_name AS playerName,
    SUM(pms.score) AS totalScore,
    SUM(pms.fours) AS totalFours,
    SUM(pms.sixes) AS totalSixes
    FROM player_details pd
    INNER JOIN player_match_score pms
    ON pd.player_id = pms.player_id
    WHERE pms.player_id = ${playerId}
    GROUP BY pd.player_id;`

  const dbResponse = await db.get(getPlayersQuery)
  response.send(dbResponse)
})

// app.get('/playerScores/:playerId/', async (request, response) => {
//   const {playerId} = request.params
//   const query = `SELECT * FROM player_match_score WHERE player_id = ${playerId};`
//   const dbRes = await db.all(query)
//   response.send(dbRes)
// })

// //

// app.get('/players/:playerId/playerScores', async (request, response) => {
//   const {playerId} = request.params
//   const getPlayersQuery = `SELECT
//         pd.player_id AS playerId,
//         pd.player_name AS playerName,
//         SUM(pms.score) AS totalScore,
//         SUM(pms.fours) AS totalFours,
//         SUM(pms.sixes) AS totalSixes
//     FROM
//         player_details pd
//     INNER JOIN
//         player_match_score pms
//     ON
//         pd.player_id = pms.player_id
//     WHERE
//         pd.player_id = ${playerId}
//     GROUP BY
//         pd.player_id;`

//   const dbResponse = await db.get(getPlayersQuery)
//   response.send(dbResponse)
// })

module.exports = app
