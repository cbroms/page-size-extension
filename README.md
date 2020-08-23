# JS Size Extension

A browser extension that records and provides webpages' javascript bundle sizes, plus stylesheets, images, and fonts. 

It captures these metrics from individual page visits through the browser extension for Firefox and records them in an API. Using the extension allows you to see page sizes for all hyperlinks that have been loaded by someone using it. 

## Extension 

The `/extension` directory contains all the code for the Firefox extension. Sadly Chrome and Safari don't give access to the same browser APIs that allow the extension to measure the size of downloaded content from a page. 


## Server

The `/server` directory contains the code for the API that manages receiving size information for new websites, in addition to serving the sizes of existing websites. 
