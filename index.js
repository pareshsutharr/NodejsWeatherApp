const http = require("http");
const fs = require("fs");
const requests = require("requests");

const port = 3000;
const host = "127.0.0.1";

const homeFile = fs.readFileSync("home.html", "utf-8");

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

const server = http.createServer((req, res) => {
    if (req.url.startsWith("/?city=")) {
        const urlParams = new URLSearchParams(req.url.split('?')[1]);
        const city = urlParams.get('city') || 'surat';

        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=035d7283b991d32c1e57a6317e3bd154`;

        requests(apiUrl)
            .on('data', (chunk) => {
                const objdata = JSON.parse(chunk);
                if (objdata.cod === "404") {
                    const errorData = replaceWithNA(homeFile);
                    res.write(errorData.replace("{%error%}", "<div class='error-popup'>Check city name</div>"));
                } else {
                    const objarr = [objdata];
                    const realTimeData = objarr.map(val => replaceval(homeFile, val)).join(" ");
                    res.write(realTimeData.replace("{%error%}", ""));
                }
            })
            .on('end', (err) => {
                if (err) return console.log('connection closed due to errors', err);
                res.end();
            });
    } else {
        res.end(homeFile.replace("{%error%}", ""));
    }
});

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
