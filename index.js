const express = require('express');
const PORT = process.env.PORT || 3000;

var app = express();
var temp = 0, humidity = 0
var lastUpdated = "";

app.use(express.json());

app.get('/', function (req, res) {
  res.write("<html>");
  res.write("    <head>");
  res.write("        <title>Weather</title>");
  res.write("        <style>");
  res.write("            body {");
  res.write("                background-color: #2A2139;");
  res.write("                font-family: Arial,Helvetica Neue,Helvetica,sans-serif;");
  res.write("            }");
  res.write("            ");
  res.write("            .centered {");
  res.write("                position: fixed;");
  res.write("                top: 50%;");
  res.write("                left: 50%;");
  res.write("                transform: translate(-50%, -50%);");
  res.write("            }");
  res.write("            ");
  res.write("             .measurement {");
  res.write("                float: left;");
  res.write("                padding: 50px;");
  res.write("                text-align: center;");
  res.write("            }");
  res.write("        </style>");
  res.write("    </head>");
  res.write("    <body>");
  res.write("        <div class=\"centered\">");
  res.write("            <div class=\"measurement\" style=\"color: #E37933\">");
  res.write("               <div style=\"font-size: 150px;\">" + temp + " &#176;C</div>");
  res.write("               <div style=\"font-size: 48px;\">Temperature</div>");
  res.write("           </div>");
  res.write("           <div class=\"measurement\" style=\"color: cyan\">");
  res.write("               <div style=\"font-size: 150px;\">" + humidity + "%</div>")
  res.write("               <div style=\"font-size: 48px;\">Humidity</div>")
  res.write("           </div>")
  res.write("           <div style=\"color: white; font-size: larger; text-align: center;\">Last updated: " + lastUpdated + "</div>")
  res.write("       </div>")
  res.write("    </body>")
  res.write("</html>");
  res.end();
})

app.post('/update', function (req, res) {
  temp = req.body.tempValue;
  humidity = req.body.humidityValue;
  lastUpdated = req.body.timestamp;
  res.end();
})

var server = app.listen(PORT, function () {
  console.log('Node server is running on port ${PORT}...');
});