const HD_HARDENED: number = 0x80000000;

export function satoshi2btc(s: number): number {
    return Number(s / 100000000).toFixed(10).replace(/\.?0+$/,"");
}

export function getSplitBlock(): number {
    return fetch(`config.json?r=${ Math.random() }`).then(response => {
        var contentType = response.headers.get("content-type");
        if(contentType && contentType.includes("application/json")) {
            return response.json();
        }
        throw new TypeError("Not a JSON");
    }).catch(function(error) { console.error(error); });
}

export function getValidInputs(inputs: Array<Object>): Array<Object> {
    let validInputs = [];
    for(let input of inputs){
    
    }
}

export function calculateFee(inputs: number, outputs: number, feePerByte: number): number {    
    let inputFee = (inputs * 149 + outputs * 35 + 10) * feePerByte;
    return inputFee;
}

export function getSerializedPath(path: Array<number>): string {
    return path.map((i) => {
        let s = (i & ~HD_HARDENED).toString();
        if (i & HD_HARDENED) {
            return s + "'";
        } else {
            return s;
        }
    }).join('/');
}

export function isTrezorAccount(trezorAccounts, usedAccounts, address): boolean {
    let accounts = [...trezorAccounts, ...usedAccounts];
    for(let account of accounts) {
        if(account.address === address) {
            return true;
        }
    }
    return false;
}

export function trezorAccountLabel(trezorAccounts, address): string {
    let accounts = [...trezorAccounts];
    for(let account of accounts) {
        if(account.address === address) {
            return account.name;
        }
    }
    return "Account";
}