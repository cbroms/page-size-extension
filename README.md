# Webpage Resource Size Extension

A tiny (3 KB) browser extension that records and provides webpages' sizes before you click a hyperlink. Resource size measurements include javascript files, stylesheets, images, videos, and fonts. It measures anything that's downloaded before the browser indicates that the page is fully loaded (through the [`webNavigation.onCompleted`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webNavigation/onCompleted)/[`window.onload`](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event) event.)

It captures these metrics from individual page visits through the browser extension and records them to a database completely anonymously (no personally-identifiable information is sent, parsed, or recorded.) Using the extension allows you to see page sizes for all hyperlinks that have been loaded by the users of the extension. For this reason it only provides sizes for a small subset of all indexed pages (though it still includes javascript and stylesheet sizes for the domain, even if the exact page has not been visited before.) You _can_ opt out of sending page sizes from your browser, though this defeats the purpose of the extension as nobody (including you) benefits from knowing the size of the pages your browser loads.

This extension is for Firefox only; Chrome and Safari don't expose the [`webRequest.StreamFilter` object](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/StreamFilter) that allows the extension to measure the size of downloaded content from a page.

Both the extension and the server are extremely small (under 200 lines of javascript each) and aim to be easily understandable. More detail about each follows.

## Extension

The `/extension` directory contains all the code for the Firefox extension. It has two primary parts:

### Background script

The background script passively records the sizes of resources loaded after the browser navigates to the page. To do so, it requires the `webRequest` API with the `webRequestBlocking` permission, in addition to the `webNavigation` API and permission.

#### Recorded resource types

There are a number of possible [resource types](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/ResourceType) that the extension measures:

```json
{
	"resource_types": [
		"main_frame",
		"font",
		"image",
		"imageset",
		"script",
		"stylesheet",
		"sub_frame",
		"media"
	]
}
```

The `main_frame` is the document itself, which contains links to resources including javascript files (`script`), iframes (`sub_frame`), videos (`media`), and others. The extension measures the size (in bytes) and quantity of each resource type for a page:

```json
{
	"main_frame": { "requests": 1, "totalData": 7499 },
	"stylesheet": { "requests": 2, "totalData": 19096 },
	"script": { "requests": 4, "totalData": 41497 },
	"imageset": { "requests": 109, "totalData": 1529080 },
	"image": { "requests": 15, "totalData": 25754 }
}
```

This data plus the page URL is sent to the server when the page finishes loading.

### Content script

The content script is injected into search engine results pages (SERPs) and gets the sizes of all hyperlinks displayed from the server. Currently, the extension supports SERPs for:

-   Google
-   DuckDuckGo

## Server

The `/server` directory contains the code for the API that manages receiving size information for new websites, in addition to serving the sizes of existing websites. The server is a Nodejs Express app, using Redis as a database.

There are two routes: `/get_metrics` and `/post_metrics`. To get the metrics of any given page, make a GET request with the URL as a query parameter:

```
GET http://localhost:3000/get_metrics/?url=https://en.wikipedia.org/wiki/Los_Angeles
```

It will return information for that page and its domain, if it has been visited:

```json
{
	"url": {
		"data": {
			"main_frame": { "requests": 1, "totalData": 7499 },
			"stylesheet": { "requests": 2, "totalData": 19096 },
			"script": { "requests": 4, "totalData": 41497 },
			"imageset": { "requests": 109, "totalData": 1529080 },
			"image": { "requests": 15, "totalData": 25754 }
		},
		"lastChecked": "2020-08-24T17:51:39.335Z"
	},
	"domain": {
		"data": {
			"script": { "requests": 4, "totalData": 41497 },
			"stylesheet": { "requests": 2, "totalData": 19096 }
		},
		"lastChecked": "2020-08-24T17:51:39.335Z"
	}
}
```

If the exact page has not been visited, but another page on the same domain has, it will return just the domain information:

```json
{
	"url": null,
	"domain": {
		"data": {
			"script": { "requests": 4, "totalData": 41497 },
			"stylesheet": { "requests": 2, "totalData": 19096 }
		},
		"lastChecked": "2020-08-24T17:51:39.335Z"
	}
}
```

If neither the page nor the domain has been visited, it will return `null` for both.

Providing new information is performed through a POST request:

```
POST http://localhost:3000/post_metrics/
```

With a JSON body:

```json
{
	"url": "https://en.wikipedia.org/wiki/Los_Angeles",
	"data": {
		"main_frame": { "requests": 1, "totalData": 7499 },
		"stylesheet": { "requests": 2, "totalData": 19096 },
		"script": { "requests": 4, "totalData": 41497 },
		"imageset": { "requests": 109, "totalData": 1529080 },
		"image": { "requests": 15, "totalData": 25754 }
	}
}
```

Ensure you have the correct content type header (`'Content-Type': 'application/json'`) when making the request.

## Development

Run the server locally by first [installing Redis](https://redis.io/topics/quickstart), then installing the dependencies:

```
$ cd server
$ npm install
```

Then, run the server:

```
$ npm run dev
```

Alternatively, you can run both the express app and Redis with docker compose:

```
$ docker-compose up
```

Install the extension temporarily by going to `about:debugging#/runtime/this-firefox` in Firefox. Click `Load Temporary Add-on...` and select `manifest.json` from the `/extension` directory of this repository.

As you navigate around the web, your database will begin to populate with page sizes, and the extension will display the sizes of pages you've visited on SERP pages.
