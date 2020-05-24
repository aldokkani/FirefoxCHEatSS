const VARIANTS = ['chess', 'giveaway', 'horde', 'atomic', 'kingofthehill', 'racingkings', '3check', 'crazyhouse'];

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('variant')) {
            browser.tabs
                .query({ active: true, currentWindow: true })
                .then((tabs) => {
                    browser.tabs.sendMessage(tabs[0].id, {
                        variant: e.target.textContent,
                    });
                })
                .catch(console.error);
        }
    });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
    document.querySelector('#popup-content').classList.add('hidden');
    document.querySelector('#error-content').classList.remove('hidden');
    console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({ file: '/popup/content_script.js' }).then(listenForClicks).catch(reportExecuteScriptError);
