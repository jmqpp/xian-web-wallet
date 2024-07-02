// Save the original fetch function
const originalFetch = window.fetch;

// Define a function to wrap fetch with timeout
function fetchWithTimeout(url, options, timeout = 5000) {
    return Promise.race([
        originalFetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

// Override the global fetch function
window.fetch = function(url, options) {
    return fetchWithTimeout(url, options);
};

if (document.getElementById('side-change-page-settings')) {
    document.getElementById('side-change-page-settings').addEventListener('click', function() {
        changePage('settings');
    });
}

if (document.getElementById('side-change-page-ide')) {
    document.getElementById('side-change-page-ide').addEventListener('click', function() {
        changePage('ide');
    });
}

if (document.getElementById('side-change-page-wallet')) {
document.getElementById('side-change-page-wallet').addEventListener('click', function() {
    changePage('wallet');
});
}

if(document.getElementById('side-lock-wallet')) {
document.getElementById('side-lock-wallet').addEventListener('click', function() {
    lockWallet();
});
}

if(document.getElementById('side-change-page-governance')) {
document.getElementById('side-change-page-govenance').addEventListener('click', function() {
    changePage('governance');
});

}

function lockWallet() {
    let confirm_lock = confirm("Are you sure you want to lock the wallet?");
    if (!confirm_lock) {
        return;
    }
    // Locks the wallet
    unencryptedPrivateKey = null;
    locked = true;
    changePage('password-input');
}