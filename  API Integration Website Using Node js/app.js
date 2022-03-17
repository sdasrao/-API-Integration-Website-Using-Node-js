const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs")
// const auth = require("./auth/auth.json");
const port = 3000;
const {apiKey} = require("./auth/auth.json");
const server = http.createServer();
server.on("request", connection_handler);

function connection_handler(req, res) {
    console.log(`New Request Received from ${req.url}`);
    if(req.url === '/'){
      let formStream =  fs.createReadStream("./html/home.html"); // was form.html
      res.writeHead(200, {"Content-Type": "text/html"});
      formStream.pipe(res);
     
    } 
    else if(req.url.startsWith("/get_stats")) {
      const { country } = url.parse(req.url, true).query;
      console.log("country ==> ", country);
      getCovidSummary(country, res);
    }
}

function getCovidSummary(country, ress) {
  const options = {
    'method': 'GET',
    'hostname': 'api.covid19api.com',
    'path': `/live/country/${country}/status/confirmed`,
    'headers': {
    },
    'maxRedirects': 20
  };

  const req = https.request(options, function (res) {
    const chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function (chunk) {
      var body = Buffer.concat(chunks);
      // console.log(body.toString());
      const data = JSON.parse(body.toString());
      holidaySummary(country, data[0], ress);  //call holiday api
      console.log(data[0])
    });

    res.on("error", function (error) {
      console.error(error);
    });
  });

  req.end();
}

function holidaySummary (country, data, ress) {

  var options = {
  'method': 'GET',
  'hostname': 'calendarific.com',
  'path': `/api/v2/holidays?api_key=${apiKey}&country=${country}&year=2019`,
  'headers': {
    'Cookie': 'PHPSESSID=0kbg82o15gqge8rk6h2k2shf91'
  },
  'maxRedirects': 20
  };

  var req = https.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function (chunk) {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
    const holidayInfo = JSON.parse(body.toString()); //parsing the Recieved data from the holiday api
    ress.writeHead(200, { 'Content-Type': 'text/html' }); // setting type of content to be sent back
    ress.write(htmlDoc(holidayInfo.response.holidays, data)); //sending response back to web page 
  });

  res.on("error", function (error) {
    console.error(error);
  });
  });

  req.end();
}

//Generate HTML with data from the api
function htmlDoc(holiday, data) {
  const { Confirmed, Deaths, Recovered, Active, Date } = data;
  let holidayData;
  if(holiday && holiday[0]) {
    holidayData = `<p>Name: ${holiday[0].name}</p>
    <p>Description: ${holiday[0].description}</p>`;
  } else {
    holidayData= 'No Data Found';
  }
  
  const doc = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <style>
      body {
          background-color: white;
          
      }
      h1{
          color: red;
          text-align: center;
          
      }
      h2{
          color:royalblue;
          text-align: center;
          
      }
   
  </style>
  <body>
      <h1>SUCCESS</h1>
      <h2>Covid Summary</h2>
      <h3>Total Deaths: ${Deaths}</h3>
      <h3>Confirmed: ${Confirmed} </h3>
      <h3>Recovered: ${Recovered}</h3>
      <h3>Active: ${Active}</h3>
      <h3>Date: ${Date}</h3>
      <h2>Holiday Info</h2>
      <h3>${holidayData}
      <a href="http://localhost:3000/">RETURN TO THE HOMEPAGE!</a></h3>
      
  </body>
  </html>`
  return doc;
}
server.on("listening", () => console.log(`Now Listening on Port ${port}`));
server.listen(port);


 