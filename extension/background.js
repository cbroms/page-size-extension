const api = "http://localhost:3000/post_metrics";
const requests = {};

function logURL(details) {
	let url = details.documentUrl;

	// this signals that a new page is being loaded
	if (details.type === "main_frame") {
		requests[details.url] = {};
		url = details.url;
	}

	// the filter allows us to passively record the size of the data as it loads
	let filter = browser.webRequest.filterResponseData(details.requestId);
	let dataSize = 0;

	filter.ondata = (event) => {
		// event.data is an ArrayBuffer with a byteLength property
		dataSize = event.data.byteLength;
		// pass through the data to the page
		filter.write(event.data);
	};

	filter.onstop = (event) => {
		filter.disconnect();
		// record the loaded data size
		if (requests[url][details.type]) {
			requests[url][details.type].requests += 1;
			requests[url][details.type].totalData += dataSize;
		} else {
			requests[url][details.type] = {
				requests: 1,
				totalData: dataSize,
			};
		}
	};
}

function logURLComplete(details) {
	const data = requests[details.url];

	if (data) {
		const postData = { url: details.url, data: data };
		const request = new Request(api, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(postData),
		});

		fetch(request).then((response) => {
			console.log(response.status);
		});
	}
}

browser.webRequest.onBeforeRequest.addListener(
	logURL,
	{ urls: ["<all_urls>"] },
	["blocking"]
);

browser.webNavigation.onCompleted.addListener(logURLComplete);
