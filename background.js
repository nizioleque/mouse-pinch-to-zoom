'use strict';

// this runs when the extension is first installed and loads the settings from synchronized storage (or sets the default values)
chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        // configure default memory
        const defaultSettings = {
            advanced: 0,
            mode: 0,
            speed: 1,
            speedCustom: 0.4,
            mult: 0.4,
            smoothness: 1,
            smoothnessCustom: 4,
            steps: 4,

            fixTouchpadScroll: true,
            fixTouchpadScrollThreshold: 30,
            fixFixed: true,
            fixFixedTransparency: true,
            fixAbsolute: true,
            fixAbsoluteBorder: false
        };

        chrome.storage.sync.get(Object.keys(defaultSettings), items => {
            if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
            else {
                Object.keys(defaultSettings).forEach(key => {
                    if (items[key] === undefined) {
                        const object = {};
                        object[key] = defaultSettings[key];
                        chrome.storage.sync.set(object);
                    }
                });
            }
        });
    }

    // tutorial page
    chrome.storage.sync.get('tutorialDisplayed', items => {
        if (chrome.runtime.lastError) console.error(chrome.runtime.lastError);
        else if (!items.tutorialDisplayed) {

            // show tutorial
            chrome.tabs.create({
                url: chrome.runtime.getURL('welcome.html')
            });
            chrome.storage.sync.set({
                tutorialDisplayed: chrome.runtime.getManifest().version
            });

            // set badge time (on first install or update from 1.0)
            if (details.reason === 'install' || details.previousVersion === '1.0') {
                chrome.storage.sync.set({
                    installTime: Date.now(),
                    triggers: 0,
                    badgeDisplayed: false
                });
            }
            
        }
    });
});

// checks if enough time has passed since installation
const badgeTime = 24 * 3600 * 1000;
//const badgeTime = 10 * 1000; // debug
const triggersThreshold = 10;
function checkTime() {
    chrome.storage.sync.get(['installTime', 'badgeDisplayed', 'triggers'], items => {
        if (!items.badgeDisplayed && Date.now() - items.installTime > badgeTime && items.triggers > triggersThreshold) {
            setBadge();
        }
    });
}

function setBadge() {
    chrome.storage.sync.set({
        badgeDisplayed: 'show'
    });
    chrome.action.setBadgeBackgroundColor({ color: '#000' });
    chrome.action.setBadgeText({ text: '⚠️' });
    chrome.notifications.create(undefined, {
        message: 'Thank you for using my extension!\nIf you\'re enjoying it, please visit the options menu to find out how to support me',
        silent: true,
        title: 'Mouse Pinch-to-Zoom',
        type: 'basic',
        iconUrl: 'icons/icon128.png'
    });

}

function removeBadge() {
    chrome.action.setBadgeText({ text: '' });
    chrome.storage.sync.set({
        badgeDisplayed: 'displayed'
    });
}

function incrementTriggers() {
    chrome.storage.sync.get('triggers', items => {
        chrome.storage.sync.set({
            triggers: items.triggers + 1
        });
    });
    checkTime();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.incrementTriggers) {
        incrementTriggers();
    }
    if (request.removeBadge) {
        removeBadge();
    }
});