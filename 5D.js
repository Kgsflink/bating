// ==UserScript==
// @name         Intercept and Filter Requests
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Intercept and filter payload data from requests
// @author       Your Name
// @match        https://*.tirangaapi.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    let interceptEnabled = true; // Automatically enable interception

    console.log('Request interception is set up and enabled');

    // Function to handle and log fetch request and response
    const handleFetch = (response, args) => {
        if (interceptEnabled && (response.url.includes("tirangaapi.com/api/webapi/GetGame5DIssue") || response.url.includes("tirangaapi.com/api/webapi/GetNoaverage5DEmerdList"))) {
            console.log('Intercepted fetch request to:', response.url);
            console.log('Request headers:', args[1]?.headers);
            console.log('Request payload:', args[1]?.body);
            response.clone().json().then(data => {
                console.log('Response payload:', data);
            }).catch(err => {
                console.error('Error reading response:', err);
            });
        }
    };

    // Override the native fetch function
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch(...args).then(response => {
            handleFetch(response, args);
            return response;
        }).catch(err => {
            console.error('Fetch error:', err);
            throw err;
        });
    };

    // Override the native XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;  // Store the URL for use in the send method
        return originalXhrOpen.call(this, method, url, ...rest);
    };

    const originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
        this.addEventListener('load', function() {
            if (interceptEnabled && (this._url.includes("tirangaapi.com/api/webapi/GetGame5DIssue") || this._url.includes("tirangaapi.com/api/webapi/GetNoaverage5DEmerdList"))) {
                console.log('Intercepted XHR request to:', this._url);
                console.log('Request payload:', body);
                try {
                    const responseJson = JSON.parse(this.responseText);
                    console.log('Response payload:', responseJson);
                } catch (err) {
                    console.error('Error parsing response JSON:', err);
                    console.log('Response payload:', this.responseText);
                }
            }
        });
        return originalXhrSend.call(this, body);
    };

})();
