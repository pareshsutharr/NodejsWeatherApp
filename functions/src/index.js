const express = require("express");
const fs = require("fs");
const requests = require("requests");
const serverless = require("serverless-http");

const app = express();

const homeFile = fs.readFileSync("./dist/home.html", "utf-8");

const replaceval = (tempdata, val) => {
    const tempCelsius = val ? (val.main.temp - 273.15).toFixed(2) : "N/A";
    const tempmintemp = val ? (val.main.temp_min - 273.15).toFixed(2) : "N/A";
    const tempmantemp = val ? (val.main.temp_max - 273.15).toFixed(2) : "N/A";
    const location = val ? val.name : "City Not Found";
    const country = val ? val.sys.country : "Country Not Found";
    const tempstatus = val ? val.weather[0].main : "Weather Not Available";

    let temperature = tempdata.replace("{%temp%}", tempCelsius);
    temperature = temperature.replace("{%mintemp%}", tempmintemp);
    temperature = temperature.replace("{%maxtemp%}", tempmantemp);
    temperature = temperature.replace("{%location%}", location);
    temperature = temperature.replace("{%country%}", country);
    temperature = temperature.replace("{%tempstatus%}", tempstatus);
    return temperature;
};

const replaceWithNA = (tempdata) => {
    const placeholders = {
        "{%temp%}": "N/A",
        "{%mintemp%}": "N/A",
        "{%maxtemp%}": "N/A",
        "{%location%}": "City Not Found",
        "{%country%}": "Country Not Found",
        "{%tempstatus%}": "Weather Not Available"
    };

    let result = tempdata;
    for (const placeholder in placeholders) {
        result = result.replace(new RegExp(placeholder, "g"), placeholders[placeholder]);
    }
    return result;
};

app.get("/", (req, res) => {
    const city = req.query.city || 'surat';

    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=035d7283b991d32c1e57a6317e3bd154`;

    requests(apiUrl)
        .on('data', (chunk) => {
            const objdata = JSON.parse(chunk);
            if (objdata.cod === "404") {
                const errorData = replaceWithNA(homeFile);
                res.send(errorData.replace("{%error%}", "<div class='error-popup'>Check city name</div>"));
            } else {
                const objarr = [objdata];
                const realTimeData = objarr.map(val => replaceval(homeFile, val)).join(" ");
                res.send(realTimeData.replace("{%error%}", ""));
            }
        })
        .on('end', (err) => {
            if (err) console.log('connection closed due to errors', err);
        });
});

app.use((req, res) => {
    res.send(homeFile.replace("{%error%}", ""));
});

module.exports.handler = serverless(app);
