var RPC = localStorage.getItem("rpc") || "https://testnet.xian.org";
var CHAIN_ID = null;
function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

function fromHexString(hexString) {
    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

function encryptPrivateKey(privateKey, password) {
    // Convert password to a hash and ensure it's the correct size for a key
    let hash = nacl.hash(fromHexString(password));
    let key = hash.slice(0, 32); // Assuming nacl.hash returns a Uint8Array, adjust to 32 bytes for the key
    let nonce = nacl.randomBytes(24);
    let encryptedPrivateKey = nacl.secretbox(privateKey, nonce, key);
    return toHexString(nonce) + toHexString(encryptedPrivateKey);
}

function decryptPrivateKey(encryptedPrivateKey, password, publicKey) {
    let hash = nacl.hash(fromHexString(password));
    let key = hash.slice(0, 32); // Key for secretbox must be 32 bytes
    let nonce = fromHexString(encryptedPrivateKey.slice(0, 48));
    let message = fromHexString(encryptedPrivateKey.slice(48));
    let decrypted = nacl.secretbox.open(message, nonce, key);
    
    if (decrypted) {
        decrypted = fromHexString(toHexString(decrypted).slice(0, 64)); // Ensure the private key is the correct size
        let keyPair = nacl.sign.keyPair.fromSeed(decrypted)
        if (toHexString(keyPair.publicKey) === publicKey) {
            return decrypted; // Correct password and private key size
        }
    }
    return null; // Incorrect password or private key size
}

function createKeyPair(password) {
    let keyPair = nacl.sign.keyPair()
    let _unencryptedPrivateKey = keyPair.secretKey;
    let encryptedPrivateKey = encryptPrivateKey(_unencryptedPrivateKey, password);
    return {
        publicKey: toHexString(keyPair.publicKey),
        encryptedPrivateKey: encryptedPrivateKey,
        unencryptedPrivateKey: _unencryptedPrivateKey
    };
}

function createKeyPairFromSK(privateKey, password) {
    let _unencryptedPrivateKey = fromHexString(privateKey);
    let encryptedPrivateKey = encryptPrivateKey(_unencryptedPrivateKey, password);
    let keyPair = nacl.sign.keyPair.fromSeed(_unencryptedPrivateKey);
    return {
        publicKey: toHexString(keyPair.publicKey),
        encryptedPrivateKey: encryptedPrivateKey,
        unencryptedPrivateKey: _unencryptedPrivateKey
    };
}

async function getNonce() {
  try {
      const [publicKey] = await Promise.all([readSecureCookie("publicKey")]);
      const response = await fetch(RPC + '/abci_query?path="/get_next_nonce/' + publicKey + '"');
      
      if (response.ok) {
          const responseData = await response.json();
          if (responseData.result.response.value === "AA==") {
              return 0;
          } else {
              return parseInt(atob(responseData.result.response.value), 10);
          }
      } else {
          throw new Error("Failed to fetch nonce: HTTP status " + response.status);
      }
  } catch (error) {
      throw new Error("Error fetching nonce: " + error.message);
  }
}


function signTransaction(transaction, privateKey) {
    return Promise.all([readSecureCookie("publicKey"), getNonce()]).then((values) => {
      transaction.payload.nonce = values[1];
      transaction.payload.sender = values[0];

      // sort the keys in payload (for deterministic signature generation)
      let orderedPayload = {};
      Object.keys(transaction.payload).sort().forEach(function(key) {
          orderedPayload[key] = transaction.payload[key];
      });

      let serializedTransaction = JSON.stringify(orderedPayload);
      let transactionUint8Array = new TextEncoder().encode(serializedTransaction);

      let combinedKey = new Uint8Array(64);
      combinedKey.set(privateKey);
      combinedKey.set(fromHexString(transaction.payload.sender), 32);


      // Use nacl.sign.detached to get the signature
      let signatureUint8Array = nacl.sign.detached(
        transactionUint8Array,
        combinedKey
      );
      
      // Add the ordered payload to the transaction
      transaction.payload = orderedPayload;

      // Convert the signature into a hex string
      transaction.metadata.signature = toHexString(signatureUint8Array);
      return transaction;
  });
}

async function broadcastTransaction(signedTransaction) {
  // Broadcast the transaction as hex
  signedTransaction = signedTransaction[0];
  signedTransaction = toHexString(new TextEncoder().encode(JSON.stringify(signedTransaction)));

  try {
      const response = await fetch(RPC + '/broadcast_tx_sync?tx="' + signedTransaction + '"');
      const responseData = await response.json();
      return responseData;
  } catch (error) {
      console.error('Error broadcasting transaction:', error);
      throw error;
  }
}

async function getContractFunctions(contract) {
  try {
      const response = await fetch(RPC + '/abci_query?path="/contract_methods/' + contract + '"');
      if (response.ok) {
          const responseData = await response.json();
          if (responseData.result.response.value === "AA==" || responseData.result.response.value === null) {
              return null;
          }
          const decoded = atob(responseData.result.response.value);
          return JSON.parse(decoded);
      } else {
          console.error('Failed to fetch contract functions:', response.status);
          throw new Error("Failed to fetch contract functions");
      }
  } catch (error) {
      console.error('Error fetching contract functions:', error);
      throw error;
  }
}


async function getContractCode(contract) {
  try {
      const response = await fetch(RPC + '/abci_query?path="/contract/' + contract + '"');
      if (response.ok) {
          const responseData = await response.json();
          if (responseData.result.response.value === "AA==") {
              return null;
          }
          return atob(responseData.result.response.value);
      } else {
          console.error('Failed to fetch contract code:', response.status);
          return null;
      }
  } catch (error) {
      console.error('Error fetching contract code:', error);
      return null;
  }
}

async function getVariable(contract, variable, key = "") {
  try {
      let data;
      if (key === "") {
        let response = await fetch(RPC + '/abci_query?path="/get/' + contract + '.' + variable + '"');
        data = await response.json();
      } else {
        let response = await fetch(RPC + '/abci_query?path="/get/' + contract + '.' + variable + ':' + key + '"');
        data = await response.json();
    }
      if (data.result.response.value === "AA==") {
          return null;
      }
      return atob(data.result.response.value);
  } catch (error) {
      console.error("Error fetching variable:", error);
      // reraise the error
      throw error;
  }
}

async function ping() {
  try {
    const response = await fetch(RPC + '/status');
    return response.ok;
  } catch {
    return false;
  }
}

async function getTokenInfo(contract) {
  let tokenInfo = { contract: contract };

  if (contract === "currency") {
      tokenInfo["name"] = "Xian";
      tokenInfo["symbol"] = "Xian";
      return tokenInfo;
  }

  try {
      const nameResponse = await fetch(RPC + '/abci_query?path="/get/' + contract + '.metadata:token_name"');
      if (nameResponse.status === 200) {
          const nameData = await nameResponse.json();
          if (nameData.result.response.value === "AA==") {
              tokenInfo["name"] = null;
          } else {
              let tokenName = atob(nameData.result.response.value);
              tokenInfo["name"] = tokenName;
          }
      }

      const symbolResponse = await fetch(RPC + '/abci_query?path="/get/' + contract + '.metadata:token_symbol"');
      if (symbolResponse.status === 200) {
          const symbolData = await symbolResponse.json();
          if (symbolData.result.response.value === "AA==") {
              tokenInfo["symbol"] = null;
          } else {
              let tokenSymbol = atob(symbolData.result.response.value);
              tokenInfo["symbol"] = tokenSymbol;
          }
      }

      return tokenInfo;
  } catch (error) {
      console.error("Error retrieving token info:", error);
      return tokenInfo;
  }
}

async function getStampRate() {
  try {
      const response = await fetch(RPC + '/abci_query?path="/get/stamp_cost.S:value"');
      const data = await response.json();
      if (data.result.response.value === "AA==") {
          return null;
      }
      return parseInt(atob(data.result.response.value), 10);
  } catch (error) {
      console.error("Error fetching stamp rate:", error);
      return null;
  }
}

async function getChainID() {
  try {
      const response = await fetch(RPC + '/genesis');
      const data = await response.json();
      CHAIN_ID = data.result.genesis["chain_id"]
        return CHAIN_ID;
  } catch (error) {
      console.error("Error fetching chain ID:", error);
      return null;
  }
}

async function estimateStamps(signedTransaction) {
    try {
        let serializedTransaction = JSON.stringify(signedTransaction);
        let transactionUint8Array = new TextEncoder().encode(serializedTransaction);
        let signedTransactionHex = toHexString(transactionUint8Array);
        const response = await fetch(RPC + '/abci_query?path="/calculate_stamps/' + signedTransactionHex + '"');
        const data = await response.json();
        if (data.result.response.value === "AA==") {
            return null;
        }
        let tx_result = JSON.parse(atob(data.result.response.value));
        let stamps = parseInt(tx_result["stamps_used"]);
        return stamps;
    } catch (error) {
        console.error("Error fetching stamp estimation:", error);
        return null;
    }
}

async function signMessage(message, privateKey) {
    publicKey = await readSecureCookie("publicKey");
    let combinedKey = new Uint8Array(64);
    combinedKey.set(privateKey);
    combinedKey.set(fromHexString(publicKey), 32);


    // Use nacl.sign.detached to get the signature
    
    let messageUint8Array = new TextEncoder().encode(message);
    let signature = nacl.sign.detached(messageUint8Array, combinedKey);
    return toHexString(signature);
}