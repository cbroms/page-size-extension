const styles = `
    .result__extras__url { 
        max-width: 60%;
        flex-basis: content;
    }
    .result__extras__badge {
        padding: 0 5px;
        margin: 0 5px;
        background-color: #282828;
        border-radius: 4px;
    }
`;

const styleSheet = document.createElement("STYLE");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const api = "http://localhost:3000/get_metrics";

const createBadge = (content) => {
    const badge = document.createElement("SPAN");
    badge.classList.add("result__extras__badge");
    badge.innerHTML = content;
    return badge;
};

const bytesToBestFitMetric = (bytes) => {
    if (bytes >= 1000000) {
        return `${(bytes / 1000000).toFixed(2)} MB`;
    } else if (bytes >= 1000) {
        return `${(bytes / 1000).toFixed(2)} KB`;
    } else {
        return `${bytes} Bytes`;
    }
};

const insertElements = (pElt, ...cElts) => {
    console.log(cElts);
    for (const cElt of cElts) {
        pElt.insertAdjacentElement("afterend", cElt);
    }
};

const checkAllResults = () => {
    const results = document.getElementsByClassName("result__url");

    for (const elt of results) {
        const request = new Request(`${api}/?url=${elt.href}`, {
            method: "GET",
        });

        fetch(request)
            .then((response) => response.json())
            .then((data) => {
                if (data.url) {
                    // sum up all loaded data
                    let total = 0;
                    for (key in data.url.data) {
                        total += data.url.data[key].totalData;
                    }

                    insertElements(
                        elt.parentNode,
                        createBadge(bytesToBestFitMetric(total)),
                        createBadge(bytesToBestFitMetric(total))
                    );
                } else if (data.domain) {
                    insertElements(
                        elt.parentNode,
                        createBadge(
                            `Scripts: ${bytesToBestFitMetric(
                                data.domain.data.script.totalData
                            )}`
                        )
                        // createBadge(
                        //     `Style: ${bytesToBestFitMetric(
                        //         data.domain.stylesheet.totalData
                        //     )}`
                        // )
                    );
                }
            });
    }
};

window.onload = () => {
    checkAllResults();
};
