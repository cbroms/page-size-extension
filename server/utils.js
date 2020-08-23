// determine if the string is a valid URL
exports.isValidHttpUrl = (string) => {
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
};

// get the hostname of a URL
exports.getHostnameFromUrl = (url) => {
    return new URL(url).hostname;
};

// clean the url of any params and protocol
exports.cleanUrl = (url) => {
    const u = new URL(url);
    return u.hostname + u.pathname;
};
