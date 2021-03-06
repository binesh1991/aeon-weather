const express = require('express')
const { Pool } = require('pg')
const PORT = process.env.PORT || 3000

var app = express()
var temp = 0, humidity = 0
var lastUpdated = ""
var history = []

app.use(express.json())

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

app.get('/', function (req, res) {
  readFromDb()

  var values = ["-", "-", "-"]
  var temps = []
  var humidities = []
  var counts = []

  if (history?.length > 0) {
    var lastLogged = history[history.length - 1]
    values = [lastLogged.temperature, lastLogged.humidity, lastLogged.time_stamp]
  }

  history.forEach((item, index) => {
    temps.push(item.temperature)
    humidities.push(item.humidity)
    counts.push(index + 1)
  })

  res.write("<html>\n")
  res.write("    <head>\n")
  res.write("        <title>Weather</title>\n")
  res.write("        <style>\n")
  res.write("        body {\n")
  res.write("          background-color: #2A2139;\n")
  res.write("          font-family: Arial,Helvetica Neue,Helvetica,sans-serif;\n")
  res.write("        }\n")
  res.write("        \n")
  res.write("        .centered {\n")
  res.write("          position: fixed;\n")
  res.write("          top: 50%;\n")
  res.write("          left: 50%;\n")
  res.write("          transform: translate(-50%, -50%);\n")
  res.write("        }\n")
  res.write("        \n")
  res.write("        .measurement {\n")
  res.write("          float: left;\n")
  res.write("          padding: 50px;\n")
  res.write("          text-align: center;\n")
  res.write("        }\n")
  res.write("        </style>\n")
  res.write("    </head>\n")
  res.write("    <script src=\"https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.4/Chart.js\"></script>\n")
  res.write("    <body>\n")
  res.write("        <div class=\"centered\" style=\"top: 25%;\">\n")
  res.write("            <canvas id=\"tempChart\" style=\"float: left; margin: 10px; max-width: 400px; height: 200px;\"></canvas>\n")
  res.write("            <canvas id=\"humidityChart\" style=\"float: left; margin: 10px; max-width: 400px; height: 200px;\"></canvas>\n")
  res.write("        </div>\n")
  res.write("        <div class=\"centered\">\n")
  res.write("            <div class=\"measurement\" style=\"color: #E37933;\">\n")
  res.write("                <div style=\"font-size: 120px;\">" + values[0].toString() + "&#176C</div>\n")
  res.write("                <div style=\"font-size: 48px;\">Temperature</div>\n")
  res.write("            </div>\n")
  res.write("            <div class=\"measurement\" style=\"color: cyan;\">\n")
  res.write("                <div style=\"font-size: 120px;\">" + values[1].toString() + "%</div>\n")
  res.write("                <div style=\"font-size: 48px;\">Humidity</div>\n")
  res.write("            </div>\n")
  res.write("            <div style=\"top: 50%; color: white; font-size: larger; text-align: center;\">Last updated: " + values[2].toString() + "</div>\n")
  res.write("        </div>\n")
  res.write("        <script>\n")
  res.write("        var tempValues = [" + temps.join(",") + "]\n")
  res.write("        var humidityValues = [" + humidities.join(",") + "]\n")
  res.write("        var xValues = [" + counts.join(",") + "]\n")
  res.write("        \n")
  res.write("        new Chart(\"tempChart\", {\n")
  res.write("          type: \"line\",\n")
  res.write("          data: {\n")
  res.write("            labels: xValues,\n")
  res.write("            datasets: [{\n")
  res.write("              fill: false,\n")
  res.write("              lineTension: 0,\n")
  res.write("              backgroundColor: \"rgba(227,121,51,1.0)\",\n")
  res.write("              borderColor: \"rgba(227,121,51,0.1)\",\n")
  res.write("              data: tempValues\n")
  res.write("            }]\n")
  res.write("          },\n")
  res.write("          options: {\n")
  res.write("            legend: {display: false},\n")
  res.write("            scales: {\n")
  res.write("              yAxes: [{ticks: {min: " + (temps?.length > 0 ? Math.min(...temps) : "20") + ", max: " + (temps?.length > 0 ? Math.max(...temps) : "40") + "}}]\n")
  res.write("            }\n")
  res.write("          }\n")
  res.write("        })\n")
  res.write("        \n")
  res.write("        new Chart(\"humidityChart\", {\n")
  res.write("          type: \"line\",\n")
  res.write("          data: {\n")
  res.write("            labels: xValues,\n")
  res.write("            datasets: [{\n")
  res.write("              fill: false,\n")
  res.write("              lineTension: 0,\n")
  res.write("              backgroundColor: \"rgba(0,255,255,1.0)\",\n")
  res.write("              borderColor: \"rgba(0,255,255,0.1)\",\n")
  res.write("              data: humidityValues\n")
  res.write("            }]\n")
  res.write("          },\n")
  res.write("          options: {\n")
  res.write("            legend: {display: false},\n")
  res.write("            scales: {\n")
  res.write("              yAxes: [{ticks: {min: " + (humidities?.length > 0 ? Math.min(...humidities) : "50") + ", max: " + (humidities?.length > 0 ? Math.max(...humidities) : "100") + "}}]\n")
  res.write("            }\n")
  res.write("          }\n")
  res.write("        })\n")
  res.write("        </script>\n")
  res.write("    </body>\n")
  res.write("</html>\n")
  res.end()
})

app.post('/update', function (req, res) {
  if (!isNaN(parseInt(req.body.tempValue)) && !isNaN(parseInt(req.body.humidityValue)) && req.body.timestamp && req.body.timestamp.toString().length > 0) {
    temp = parseInt(req.body.tempValue)
    humidity = parseInt(req.body.humidityValue)
    lastUpdated = req.body.timestamp
    updateHistory()
  }

  res.end()
})

async function updateHistory() {
  const client = await pool.connect()

  try {
    await client.query("BEGIN")
    var queryText = "INSERT INTO history(temperature, humidity, time_stamp) VALUES($1, $2, $3)"
    var res = await client.query(queryText, [temp, humidity, lastUpdated])
    await client.query("COMMIT")

    /*
    queryText = "SELECT COUNT(id) as count FROM history"
    res = await client.query(queryText)

    var count = res?.rows?.length > 0 ? res.rows[0].count : 0

    if (count > 24) {
      await client.query("BEGIN")
      queryText = "DELETE FROM history WHERE ctid IN (SELECT ctid FROM history ORDER BY id LIMIT $1)"
      res = await client.query(queryText, [count - 24])
      await client.query("COMMIT")
    }
    */
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

async function readFromDb() {
  const client = await pool.connect()

  client.query("SELECT t.* FROM (SELECT * FROM history ORDER BY id DESC LIMIT 24) AS t ORDER BY id ASC", (error, results) => {
    if (error) {
      console.log(error.stack)
    }

    history = results?.rows
  })

  client.release()
}

app.listen(PORT, function () {
  console.log("Node server is running on port " + PORT + "...")
})