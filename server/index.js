const express = require("express");
const bodyParser = require("body-parser");
const redis = require("redis");

const utils = require("./utils");

const app = express();
const client = redis.createClient();

const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// for both get and post, check that the URL is good and clean it
const checkAndPrepareUrl = (url, res) => {
    // verify there's a URL and it's valid
    if (!url) {
        res.status(400).send("No URL specified");
    } else if (!utils.isValidHttpUrl(url)) {
        res.status(400).send("Not a valid URL");
    } else {
        // clean the URL and extract the domain
        const cleanUrl = utils.cleanUrl(url);
        const domain = utils.getHostnameFromUrl(url);

        return [cleanUrl, domain];
    }
    return [null, null];
};

// get js metrics for a given url and its domain, if they exist
// expects a query param called url --> ?url=https://example.com/something
app.get("/get_metrics", (req, res) => {
    let url = req.query.url;

    const [cleanUrl, domain] = checkAndPrepareUrl(url, res);

    if (cleanUrl && domain) {
        // get the values for the url and the domain
        try {
            client.get(cleanUrl, (err, uVal) => {
                client.get(domain, (err, dVal) => {
                    res.json({
                        url: JSON.parse(uVal),
                        domain: JSON.parse(dVal),
                    });
                });
            });
        } catch (_) {
            res.status(500).send("Database error");
        }
    }
});

// submit js metrics for a given url
// expects json body --> {url: "", data: {}}
// where body.data contains any of the keys listed here:
// https://github.com/cbroms/page-size-extension/blob/master/README.md#recorded-resource-types
app.post("/post_metrics", (req, res) => {
    let url = req.body.url;
    let data = req.body.data;

    const [cleanUrl, domain] = checkAndPrepareUrl(url, res);

    try {
        // get the clean url data
        client.get(cleanUrl, (err, uVal) => {
            // if the data doesn't exist, add it
            if (!uVal) {
                const toSave = {
                    data: { ...data },
                    lastChecked: new Date().toISOString(),
                };
                client.set(cleanUrl, JSON.stringify(toSave));
            } else {
                // we should probably update the data at some point
            }
        });

        client.get(domain, (err, dVal) => {
            // if the data doesn't exist, add it
            if (!dVal) {
                const toSave = {
                    data: {},
                    lastChecked: new Date().toISOString(),
                };
                toSave.data["script"] = data["script"] || {};
                toSave.data["stylesheet"] = data["stylesheet"] || {};

                client.set(domain, JSON.stringify(toSave));
            } else {
                // we should probably update the data at some point
            }
        });
    } catch (_) {
        res.status(500).send("Database error");
    }

    res.status(200).end();
});

// debug stuff
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

client.on("error", (error) => {
    console.error(error);
});
