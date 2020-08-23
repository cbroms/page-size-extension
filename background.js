const allRequests = {};

function logURL(details) {
	// if the currentUrl has not been added to the allRequests obj, add it now
	if (!allRequests[details.originUrl]) {
		allRequests[details.originUrl] = {};
	}

	let filter = browser.webRequest.filterResponseData(details.requestId);

	let dataSize = 0;

	filter.ondata = (event) => {
		// event.data is an ArrayBuffer with a ByteLength property
		dataSize = event.data.byteLength;
		// pass through the data to the page
		filter.write(event.data);
	};

	filter.onstop = (event) => {
		filter.disconnect();
		// record the loaded data size
		if (allRequests[details.originUrl][details.type]) {
			allRequests[details.originUrl][details.type].requests += 1;
			allRequests[details.originUrl][details.type].totalData += dataSize;
		} else {
			allRequests[details.originUrl][details.type] = {
				requests: 1,
				totalData: dataSize,
			};
		}

		console.log(allRequests);
	};
}

browser.webRequest.onBeforeRequest.addListener(
	logURL,
	{ urls: ["<all_urls>"] },
	["blocking"]
);
