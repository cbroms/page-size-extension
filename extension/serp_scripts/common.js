const api = "http://localhost:3000/get_metrics";

// convert some number to the best fitting metric (bytes, KB, MB) string including
// metric name
const bytesToBestFitMetric = (bytes) => {
    if (bytes >= 1000000) {
        return `${(bytes / 1000000).toFixed(2)} MB`;
    } else if (bytes >= 1000) {
        return `${(bytes / 1000).toFixed(2)} KB`;
    } else {
        return `${bytes} Bytes`;
    }
};

// convert some number to a css class representing a color
const bytesToColorClassification = (bytes) => {
    if (bytes >= 1500000) {
        return "label_high";
    } else if (bytes >= 600000) {
        return "label_mid";
    } else {
        return "label_low";
    }
};

// insert child dom elts after a parent elt
const insertElements = (pElt, ...cElts) => {
    for (const cElt of cElts) {
        pElt.insertAdjacentElement("afterend", cElt);
    }
};

// adds an extension stylesheet to the page's head
const insertStyle = (url) => {
    const styleSheet = document.createElement("LINK");
    styleSheet.rel = "stylesheet";
    styleSheet.type = "text/css";
    styleSheet.href = url;
    document.head.appendChild(styleSheet);
};

// creates the badge element that contains the page size info
// also creates the tooltip that appears with more info
const createBadge = (
    badgeContent,
    color,
    tooltipHeadContent,
    tooltipContent
) => {
    try {
        const badge = document.createElement("SPAN");
        badge.classList.add("result_size_badge");
        badge.classList.add(color);
        const text = document.createTextNode(badgeContent);
        badge.appendChild(text);

        const info = document.createElement("SPAN");
        info.classList.add("result_size_info");
        const headElt = document.createElement("SPAN");
        headElt.appendChild(document.createTextNode(tooltipHeadContent));
        info.appendChild(headElt);
        const tooltipElts = tooltipContent.map((line) => {
            const lineElt = document.createElement("SPAN");
            lineElt.classList.add("result_size_info_line");

            const typeElt = document.createElement("SPAN");
            typeElt.classList.add("result_size_info_line_type");
            typeElt.innerText = line.type;
            const detailElt = document.createElement("SPAN");
            detailElt.classList.add(line.color);
            detailElt.classList.add("result_size_info_line_detail");
            detailElt.innerText = line.totalData;

            lineElt.appendChild(typeElt);
            lineElt.appendChild(detailElt);
            return lineElt;
        });
        insertElements(headElt, ...tooltipElts);
        badge.appendChild(info);

        return badge;
    } catch (e) {
        console.error(e);
    }
};

// check the results' sizes, then create and attach the badge to the result dom elt
const checkAllResults = (results, getAttachableElement) => {
    for (const elt of results) {
        const request = new Request(`${api}/?url=${elt.href}`, {
            method: "GET",
        });

        fetch(request)
            .then((response) => response.json())
            .then((data) => {
                let section = null;
                let description = "";
                let formatBadge = (content) => content;

                if (data.url) {
                    section = data.url;
                    description = "Page stats";
                } else if (data.domain) {
                    section = data.domain;
                    description = "Domain stats";
                    formatBadge = (content) => `≥ ${content}`;
                }

                if (section) {
                    // sum up all loaded data
                    let total = 0;
                    const resources = [];
                    for (key in section.data) {
                        total += section.data[key].totalData;
                        resources.push({
                            ...section.data[key],
                            type: `${key}: `,
                            color: bytesToColorClassification(
                                section.data[key].totalData
                            ),
                            totalData: bytesToBestFitMetric(
                                section.data[key].totalData
                            ),
                        });
                    }
                    // insert the information to the serp page
                    insertElements(
                        getAttachableElement(elt),
                        createBadge(
                            formatBadge(bytesToBestFitMetric(total)),
                            bytesToColorClassification(total),
                            description,
                            resources
                        )
                    );
                }
            });
    }
};
