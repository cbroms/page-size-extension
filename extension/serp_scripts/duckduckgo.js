// when the page is done loading, check
window.onload = () => {
    // insert the serp's stylesheet
    insertStyle(browser.runtime.getURL("style/tooltip.css"));
    insertStyle(browser.runtime.getURL("style/duckduckgo.css"));

    checkAllResults(
        document.getElementsByClassName("result__url"),
        (elt) => elt.parentNode
    );
};
