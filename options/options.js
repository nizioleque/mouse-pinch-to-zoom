'use strict';

let settings = {
    advanced: 0,
    mode: 0,
    speed: 1,
    speedCustom: 0.4,
    smoothness: 1,
    smoothnessCustom: 4,

    fixTouchpadScroll: true,
    fixTouchpadScrollThreshold: 30,
    fixFixed: true,
    fixFixedTransparency: true,
    fixAbsolute: true,
    fixAbsoluteBorder: false
};

let storageNames = {
    speed: {
        key: 'mult',
        values: [0.3, 0.4, 0.5],
        custom: 3
    },
    smoothness: {
        key: 'steps',
        values: [1, 4, 6],
        custom: 3
    }
}

// read settings from storage
chrome.storage.sync.get(Object.keys(settings), items => {
    if (!checkError()) {
        Object.keys(settings).forEach(key => {
            if (items[key] !== undefined) settings[key] = items[key];
        });
        loadData();
    }
});

// checkbox click
document.querySelectorAll('input[type=checkbox]').forEach(element => {
    element.addEventListener('input', e => checkboxClick(e.target));
});
function checkboxClick(element) {
    settings[element.name] = element.checked;
    setData(element.name, element.checked);
}

// advanced checkbox click
document.querySelector('input[name=advanced]').addEventListener('input', e => {
    if (e.target.checked) showAdvanced();
    else hideAdvanced();
});

// fixTouchpadScroll checkbox click
document.querySelector('input[name="fixTouchpadScroll"]').addEventListener('input', e => {
    if (e.target.checked === false) document.querySelector('input[name="fixTouchpadScrollThreshold"]').disabled = true;
    else document.querySelector('input[name="fixTouchpadScrollThreshold"]').disabled = false;
});

// fixTouchpadScrollThreshold handlers
document.querySelector('input[name="fixTouchpadScrollThreshold"]').addEventListener('input', e => {
    settings[e.target.name] = parseInt(e.target.value);
    setData(e.target.name, parseInt(e.target.value));
});

// fixFixed checkbox click
document.querySelector('input[name="fixFixed"]').addEventListener('input', e => {
    if (e.target.checked === false) document.querySelector('input[name="fixFixedTransparency"]').disabled = true;
    else document.querySelector('input[name="fixFixedTransparency"]').disabled = false;
});


// fixAbsolute checkbox click
document.querySelector('input[name="fixAbsolute"]').addEventListener('input', e => {
    if (e.target.checked === false) document.querySelector('input[name="fixAbsoluteBorder"]').disabled = true;
    else document.querySelector('input[name="fixAbsoluteBorder"]').disabled = false;
});

function showAdvanced() {
    document.querySelectorAll('.advanced').forEach(element => {
        element.classList.remove('advanced');
        element.classList.add('advanced-show');
    });
}
function hideAdvanced() {
    document.querySelectorAll('.advanced-show').forEach(element => {
        element.classList.remove('advanced-show');
        element.classList.add('advanced');
    });

    if (settings.speed == storageNames.speed.custom) document.querySelector('input[name="speed"][value="1"]').click();
    if (settings.smoothness == storageNames.smoothness.custom) document.querySelector('input[name="smoothness"][value="1"]').click();

    if (settings.fixFixed === false) document.querySelector('input[name="fixFixed"]').click();
    if (settings.fixFixedTransparency === false) document.querySelector('input[name="fixFixedTransparency"]').click();
    if (settings.fixAbsolute === false) document.querySelector('input[name="fixAbsolute"]').click();
    if (settings.fixAbsoluteBorder === true) document.querySelector('input[name="fixAbsoluteBorder"]').click();
}

// radio button click
document.querySelectorAll('input[type=radio]').forEach(element => {
    element.addEventListener('change', e => radioButtonClick(e.target));
});
function radioButtonClick(element) {
    element.checked = true;
    if (settings[element.name] != element.value) {

        // set the value for radio button
        settings[element.name] = element.value;
        setData(element.name, element.value);

        // set the modifier value (for speed, smoothness)
        if (storageNames[element.name]) {
            if (element.value == storageNames[element.name].custom)
                setData(storageNames[element.name].key, settings[element.name + 'Custom']);
            else
                setData(storageNames[element.name].key, storageNames[element.name].values[element.value]);
        }
    }
}

// custom number input
document.querySelectorAll('.input-custom').forEach(element => {
    element.addEventListener('input', e => {
        if (settings[e.target.name] != e.target.value) {
            settings[e.target.name] = Number(e.target.value);
            setData(e.target.name, Number(e.target.value));
            setData(storageNames[e.target.dataset.settingName].key, Number(e.target.value));
        }
    });
});

// custom radio button focus
document.querySelectorAll('.input-custom').forEach(element => {
    element.addEventListener('focus', e => {
        radioButtonClick(e.target.parentElement.querySelector('input[type=radio]'));
    });
});

// display data from storage
function loadData() {
    // set advanced checkbox
    document.querySelector('input[name="advanced"]').checked = settings.advanced;
    if (settings.advanced) showAdvanced();

    // set radio buttons
    document.querySelector('input[name="mode"][value="' + settings.mode + '"]').checked = true;
    document.querySelector('input[name="speed"][value="' + settings.speed + '"]').checked = true;
    document.querySelector('input[name="smoothness"][value="' + settings.smoothness + '"]').checked = true;

    // set number inputs
    document.querySelector('input[name="speedCustom"]').value = settings.speedCustom;
    document.querySelector('input[name="smoothnessCustom"]').value = settings.smoothnessCustom;

    // set fixes inputs
    document.querySelector('input[name="fixFixed"]').checked = settings.fixFixed;
    document.querySelector('input[name="fixFixedTransparency"]').checked = settings.fixFixedTransparency;
    document.querySelector('input[name="fixAbsolute"]').checked = settings.fixAbsolute;
    document.querySelector('input[name="fixAbsoluteBorder"]').checked = settings.fixAbsoluteBorder;
    document.querySelector('input[name="fixTouchpadScroll"]').checked = settings.fixTouchpadScroll;
    document.querySelector('input[name="fixTouchpadScrollThreshold"]').value = settings.fixTouchpadScrollThreshold;

    if (!settings.fixTouchpadScroll) {
        document.querySelector('input[name="fixTouchpadScrollThreshold"]').disabled = true;
    }
    if (!settings.fixFixed) {
        document.querySelector('input[name="fixFixedTransparency"]').disabled = true;
    }
    if (!settings.fixAbsolute) {
        document.querySelector('input[name="fixAbsoluteBorder"]').disabled = true;
    }
}

// helper function - save settings to storage
function setData(key, value) {
    let object = {}
    object[key] = value;
    chrome.storage.sync.set(object, checkError);
}

// show error message
function checkError() {
    if (chrome.runtime.lastError) {
        showError(chrome.runtime.lastError);
        return true;
    }
    return false;
}
function showError(msg) {
    document.querySelector('#error-msg').innerText = JSON.stringify(msg);
    document.querySelector('#error').style.display = 'block';
    window.scrollTo(0, 0);
}

// show welcome
chrome.storage.sync.get('badgeDisplayed', items => {
    if (items.badgeDisplayed === 'show') {
        document.querySelector('#welcome-short').style.display = 'none';
        document.querySelector('#welcome').style.display = 'block';
        chrome.runtime.sendMessage({
            removeBadge: true
        });
    }
});