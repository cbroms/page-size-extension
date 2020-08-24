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
                    console.log(total);
                    const disp = bytesToBestFitMetric(total);
                    const badge = createBadge(disp);
                    elt.parentNode.insertAdjacentElement("afterend", badge);
                } else if (data.domain) {
                    // let total = 0;
                    // for (key in data.domain.data) {
                    //     total += data.domain.data[key].totalData;
                    // }
                    // const badge = createBadge(
                    //     `Domain ${(data.domain.script.totalData / 1000).toFixed(
                    //         2
                    //     )} KB`
                    // );
                    // elt.parentNode.insertAdjacentElement("afterend", badge);
                }
            });
    }
};

window.onload = () => {
    checkAllResults();
};
