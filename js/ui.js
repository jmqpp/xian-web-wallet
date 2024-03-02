function createWallet() {
    let password = document.getElementById('password').value;
    let confirmPassword = document.getElementById('confirmPassword').value;
    let createWalletError = document.getElementById('createWalletError');

    if (password !== confirmPassword) {
        createWalletError.innerHTML = 'Passwords do not match!';
        createWalletError.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        createWalletError.innerHTML = 'Password must be at least 6 characters long!';
        createWalletError.style.display = 'block';
        return;
    }

    createWalletError.style.display = 'none';
    
    let keyPair = createKeyPair(password);
    let publicKey = keyPair.publicKey;
    let encryptedPrivateKey = keyPair.encryptedPrivateKey;
    let _unencryptedPrivateKey = keyPair.unencryptedPrivateKey;
    
    // Save the public key and the encrypted private key to the local storage
    localStorage.setItem('publicKey', publicKey);
    localStorage.setItem('encryptedPrivateKey', encryptedPrivateKey);

    // Save the unencrypted private key to the global variable
    unencryptedPrivateKey = _unencryptedPrivateKey;

    changePage('wallet');

}

function importWallet() {
    let password = document.getElementById('import_password').value;
    let confirmPassword = document.getElementById('import_confirmPassword').value;
    let privateKey = document.getElementById('import_privateKey').value;
    let importWalletError = document.getElementById('importWalletError');

    if (privateKey.length !== 64) {
        importWalletError.innerHTML = 'Invalid private key!';
        importWalletError.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        importWalletError.innerHTML = 'Password must be at least 6 characters long!';
        importWalletError.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        importWalletError.innerHTML = 'Passwords do not match!';
        importWalletError.style.display = 'block';
        return;
    }

    importWalletError.style.display = 'none';

    let keyPair = createKeyPairFromSK(privateKey, password);
    console.log(keyPair);
    let publicKey = keyPair.publicKey;
    let encryptedPrivateKey = keyPair.encryptedPrivateKey;
    let _unencryptedPrivateKey = keyPair.unencryptedPrivateKey;
    
    // Save the public key and the encrypted private key to the local storage
    localStorage.setItem('publicKey', publicKey);
    localStorage.setItem('encryptedPrivateKey', encryptedPrivateKey);
    
    // Save the unencrypted private key to the global variable
    unencryptedPrivateKey = _unencryptedPrivateKey;

    changePage('wallet');
}

function copyToClipboard(elementId) {
    let element = document.getElementById(elementId);
    // span
    let range, selection;
    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    document.execCommand('copy');
}

function removeWallet(){
    let confirm_delete = confirm("Are you sure you want to remove the wallet?");
    if (!confirm_delete) {
        return;
    }
    // Removes the wallet from the local storage
    localStorage.removeItem('publicKey');
    localStorage.removeItem('encryptedPrivateKey');
    unencryptedPrivateKey = null;
    changePage('get-started');
}

function unlockWallet() {
    let password = document.getElementById('unlock_password').value;
    let encryptedPrivateKey = localStorage.getItem('encryptedPrivateKey');
    let _unencryptedPrivateKey = decryptPrivateKey(encryptedPrivateKey, password);
    unencryptedPrivateKey = _unencryptedPrivateKey;
    changePage('wallet');
}