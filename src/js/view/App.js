import { h, Component } from 'preact';
import HeaderComponent from './HeaderComponent';
import Home from './HomeComponent';
import Send from './SendComponent';
import Log from './LogComponent';

const TREZOR_FIRMWARE = '1.5.1';
const INPUT_LIMIT = 350;

export default class App extends Component {

    constructor(props) {
        super(props);

        this.state = {
            log: false,
            block: null,
            useTrezorAccounts: true,
            activeAccount: 0,
        };
    }

    getAccounts(): void {

        TrezorConnect.setAccountDiscoveryLimit(30);
        // TrezorConnect.setBitcoreURLS(this.state.bitcoreApiUrl);
        TrezorConnect.closeAfterSuccess(false);
        TrezorConnect.closeAfterFailure(false);

        const destination = { id: "btc1", name: "Legacy account", simpleName: "bitcoin legacy", short: "BTC", txType: "Bitcoin", bip44: [44, 0], addressVersion: 0, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] };
        const origin = { id: "bch1", name: "bitcoin cash, 1-address", simpleName: "bitcoin cash", short: "BCH", txType: "Bcash", bip44: [44, 145], addressVersion: 0, bitcore: ['https://bch-bitcore2.trezor.io/'] };

        TrezorConnect.recoverCoins(origin, destination, response => {

            if (response.success) {
                console.log("Accounts", response);

                let accounts = [];
                let activeAccount = -1;
                let accountsLen = response.originAccounts.length - 1;
                for (let [index, account] of response.originAccounts.entries()) {
                    account.name = `Account #${(account.id + 1)}`;
                    account.available = 0;

                    // filter available unspents
                    let availableUnspents = [];
                    let lastBlockHeight = account.info.lastBlock.height;
                    let i, unspent, len = account.info.utxos.length;
                    if (len > INPUT_LIMIT) {
                        len = INPUT_LIMIT;
                        account.inputLimitExceeded = true;
                    }

                    for (i = 0 ; i < len; i++) {
                        unspent = account.info.utxos[i];
                        // at least 1 confirmation
                        if (lastBlockHeight - unspent.height > 0) {
                            account.available += unspent.value;
                            availableUnspents.push(unspent);
                        } else {
                            account.info.balance -= unspent.value;
                            console.log("Not confirmed utxo", lastBlockHeight, unspent);
                        }
                    }
                    account.unspents = availableUnspents;

                    if (account.available > 0 && activeAccount < 0) {
                        activeAccount = index;
                    }

                    accounts.push(account);
                }

                if (activeAccount < 0) activeAccount = 0;

                const fees = [];
                for (let f in response.fees) {
                    fees.push({
                        name: f,
                        maxFee: response.fees[f]
                    })
                }
                fees.reverse();

                let trezorAddresses = [];
                if(this.state.useTrezorAccounts){
                    for (let acc of response.originAddresses) {
                        const usedAddressIndex: number = acc.info.usedAddresses.length;
                        trezorAddresses.push({ 
                            address: acc.info.unusedAddresses[0],
                            addressIndex: 0,
                            unusedAddresses: acc.info.unusedAddresses,
                            usedAddressIndex,
                            name: `Account #${(acc.id + 1)}`,
                            basePath: acc.basePath,
                            path: acc.basePath.concat([0, usedAddressIndex]),
                        });
                        
                    }
                }

                this.setState({ 
                    activeAccount: activeAccount,
                    accounts: accounts,
                    originAccount: origin,
                    destinationAccount: destination,
                    trezorAccounts: trezorAddresses,
                    originAddresses: response.originAddresses,
                    fees: fees,
                    error: null
                });


            } else {

                window.scrollTo(0, 0);
                console.error(response.error);
                this.setState({
                    error: response.error
                });
            }

        });
    }

    verifyAddress(address): void {

        const { originAccount, destinationAccount, accounts, activeAccount, trezorAccounts } = this.state;

        let index = -1;
        for (let [i, a] of trezorAccounts.entries()) {
            if (a.address === address) {
                index = i;
                break;
            }
        }

        if (index >= 0) {
            const addr = trezorAccounts[index];
            const account = accounts[activeAccount];
            const isSegwit = destinationAccount.id === 'btcX' || originAccount.id.indexOf('btg') >= 0 ? true : account.segwit;
            TrezorConnect.getAddress(addr.path, originAccount.txType, isSegwit, (response) => {
                //console.log("TrezorConnect.getAddress response", response);
            });
        }
    }

    selectAccount(index: number): void {
        this.setState({
            activeAccount: index,
            error: null
        })
    }

    hideError():void {
        this.setState({
            error: null
        });
    }

    showLog():void {
        setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
        }, 100);
        
        this.setState({
            log: !this.state.log
        });
    }

    hideLog(): void {
        this.setState({
            log: false
        });
    }

    findTrezorAccountByAddress(address: string): Object {
        const { trezorAccounts } = this.state;
        for (let [i, a] of trezorAccounts.entries()) {
            if (a.address === address) {
                return a;
            }
        }
        return null;
    }

    signTX(account: Object, address: number, amount: number): void {

        console.log("SignTx params", account, address, amount);
        const outputs = [
            {
                address: address,
                value: amount
            }
        ];

        TrezorConnect.closeAfterSuccess(false);
        TrezorConnect.setBitcoreURLS(this.state.originAccount.bitcore);
        TrezorConnect.recoverSignTx(account, account.unspents, outputs, response => {
            console.log("SingTx", response)
            if(response.success){
                TrezorConnect.closeAfterSuccess(true);
                TrezorConnect.recoverPushTx(response.serialized_tx, pushResult => {

                    console.log("pushTransaction", pushResult)
                    if (pushResult.success) {
                        // update cached values for account
                        let hashHex = pushResult.txid;
                        let index = this.state.activeAccount;
                        let newAccounts = [ ...this.state.accounts ];
                        let currentAccount = newAccounts[index];
                        if (account.inputLimitExceeded) {
                            const total: number = account.unspents.reduce((t, r) => t + r.value, 0);
                            currentAccount.info.balance -= total;
                            currentAccount.available = 0;

                            // remove used utxos
                            currentAccount.info.utxos.splice(0, account.unspents.length);

                            // recalculate available outputs
                            let lastBlockHeight = currentAccount.info.lastBlock.height;
                            let i, unspent, len = currentAccount.info.utxos.length;
                            if (len > INPUT_LIMIT) {
                                len = INPUT_LIMIT;
                                account.inputLimitExceeded = true;
                            } else {
                                account.inputLimitExceeded = false;
                            }

                            let availableUnspents = [];
                            for (i = 0 ; i < len; i++) {
                                unspent = currentAccount.info.utxos[i];
                                if (lastBlockHeight - unspent.height >= 0) {
                                    currentAccount.available += unspent.value;
                                    availableUnspents.push(unspent);
                                }
                            }
                            currentAccount.unspents = availableUnspents;

                        } else {
                            currentAccount.info.balance = 0;
                            currentAccount.available = 0;
                        }
                        
                        currentAccount.transactionSuccess = {
                            url: `${this.state.originAccount.bitcore[0]}tx/${hashHex}`,
                            hashHex: hashHex
                        }
                        
                        // update fresh address
                        let currentTrezorAccount = this.findTrezorAccountByAddress(address);
                        if (currentTrezorAccount.addressIndex + 1 < currentTrezorAccount.unusedAddresses.length) {
                            currentTrezorAccount.addressIndex++;
                            currentTrezorAccount.usedAddressIndex++;
                        }
                        currentTrezorAccount.address = currentTrezorAccount.unusedAddresses[ currentTrezorAccount.addressIndex ];
                        currentTrezorAccount.path = currentTrezorAccount.basePath.concat([0, currentTrezorAccount.usedAddressIndex]);

                        // store tx in local storage
                        // window.localStorage.setItem(account.address, hashHex);

                        // update view
                        this.setState({
                            accounts: newAccounts,
                            error: null
                        });
                    } else {
                        window.scrollTo(0, 0);
                        console.error(pushResult.error);
                        this.setState({
                            error: pushResult.error.message || pushResult.error
                        });
                    }
                });
                
            }else{
                window.scrollTo(0, 0);
                console.error(response.error);
                this.setState({
                    error: response.error
                });
            }
        }, TREZOR_FIRMWARE, 'Bcash');


        // simulate error
        // this.setState({
        //     error: "Cancelled by user"
        // });
        // return;

        // simulate success: update account
        // let hashHex = '1234abcd';
        // let index = this.state.activeAccount;
        // let newAccounts = [ ...this.state.accounts ];
        // newAccounts[index].availableBCH = 0;
        // newAccounts[index].transactionSuccess = {
        //     url: `${this.state.bitcoreApiUrl}tx/${hashHex}`,
        //     hashHex: hashHex
        // }

        // let newBccAccounts = [ ...this.state.bchAccounts ];
        // let usedBchAccounts = [ ...this.state.usedBchAccounts ];
        // usedBchAccounts.push(this.state.bchAccounts[0]);
        // newBccAccounts.splice(0, 1);

        // window.localStorage.setItem(account.bitcoinCashAddress, hashHex);

        // this.setState({
        //     accounts: newAccounts,
        //     bchAccounts: newBccAccounts,
        //     usedBchAccounts: usedBchAccounts,
        //     error: null
        // });
        // return;

    }

    render(props): void {

        let view;
        if (this.state.accounts === undefined) {
            view = <Home 
                        click={ this.getAccounts.bind(this) }
                        block={ this.state.block }
                        error={ this.state.error }
                        hideError={ this.hideError.bind(this) }
                         /> 
        } else {
            const { accounts, originAccount, trezorAccounts, fees, activeAccount, success, error } = this.state;
            view = <Send 
                        // callbacks
                        send={ this.signTX.bind(this) }
                        verifyAddress={ this.verifyAddress.bind(this) }
                        selectAccount={ this.selectAccount.bind(this) }
                        hideError={ this.hideError.bind(this) }
                        // data
                        useTrezorAccounts={ this.state.useTrezorAccounts && trezorAccounts.length > 0 }
                        accounts={ accounts }
                        originAccount={ originAccount }
                        trezorAccounts={ trezorAccounts }
                        fees={ fees }
                        account={ accounts[activeAccount] }
                        success={ accounts[activeAccount].transactionSuccess }
                        error={ error } />;
        }

        return (
            <div className="container">
                <HeaderComponent />
                <main>
                    { view }
                    <Log displayed={ this.state.log } hideLog={ this.hideLog.bind(this) } />
                </main>
                <footer>
                    <span>© 2017</span> <a href="http://satoshilabs.com">SatoshiLabs</a> | <a onClick={ this.showLog.bind(this) }>Show log</a>
                </footer>
            </div>
        );
    }
}
