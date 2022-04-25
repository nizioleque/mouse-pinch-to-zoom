function optionsClick(e) {
    chrome.tabs.create({
        url: 'chrome://extensions/?options=' + chrome.runtime.id
    });
}

function settingsClick(e) {
    chrome.tabs.create({
        url: 'chrome://extensions/?id=' + chrome.runtime.id
    });
}

document.querySelector('#ext-options').addEventListener('click', optionsClick);
document.querySelector('#chrome-settings').addEventListener('click', settingsClick);
