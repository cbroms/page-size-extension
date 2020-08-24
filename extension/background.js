const api = "http://localhost:3000/post_metrics";

// we're only interested in a few of the resource types. The full list is here:
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType
const validResourceTypes = [
	"main_frame",
	"font",
	"image",
	"imageset",
	"script",
	"stylesheet",
	"sub_frame",
	"media",
];
const requests = {};

// handle a resource loading
const logURL = (details) => {
	if (validResourceTypes.includes(details.type)) {
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
			if (requests[url] && requests[url][details.type]) {
				requests[url][details.type].requests += 1;
				requests[url][details.type].totalData += dataSize;
			} else if (requests[url]) {
				requests[url][details.type] = {
					requests: 1,
					totalData: dataSize,
				};
			}
		};
	}
};

// handle a webNavigation onCompleted event by saving the loaded data size
const logURLComplete = (details) => {
	const data = requests[details.url];

	if (data) {
		const postData = { url: details.url, data: data };

		// send the website's resource size data to the API
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
};

browser.webRequest.onBeforeRequest.addListener(
	logURL,
	{ urls: ["<all_urls>"] },
	["blocking"]
);

browser.webNavigation.onCompleted.addListener(logURLComplete);
