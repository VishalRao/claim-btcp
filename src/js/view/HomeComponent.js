import { h, Component } from 'preact';
import Message from './MessageComponent';
import SelectComponent from './SelectComponent';


const initalState = {
    originAccount: null,
    destinationAccount: null,
    destinationOptions: null
};

const accounts = [
    { id: "btc1", name: "Legacy account", simpleName: "bitcoin legacy", short: "BTC", txType: "Bitcoin", bip44: [44, 0], addressVersion: 0, bitcore: ['https://btc1.trezor.io', 'https://btc2.trezor.io', 'https://btc3.trezor.io', 'https://btc4.trezor.io', 'https://btc5.trezor.io'] },
    { id: "btc3", name: "Standard account", simpleName: "bitcoin", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 5, bitcore: ['https://btc1.trezor.io', 'https://btc2.trezor.io', 'https://btc3.trezor.io', 'https://btc4.trezor.io', 'https://btc5.trezor.io'] },
    // { id: "btcX", name: "bitcoin, wrongly generated 1-address (XPUB)", simpleName: "bitcoin", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 0, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    // { id: "btcM", name: "bitcoin, M-address", simpleName: "bitcoin", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 5, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    // { id: "bch1", name: "bitcoin cash, 1-address", simpleName: "bitcoin cash", short: "BCH", txType: "Bcash", bip44: [44, 145], addressVersion: 0, bitcore: ['https://bch-bitcore2.trezor.io/'] },
    // { id: "ltc3", name: "litecoin, 3-address", simpleName: "litecoin", short: "LTC", txType: "Litecoin", bip44: [49, 2], addressVersion: 50, bitcore: ['https://ltc-bitcore1.trezor.io/', 'https://ltc-bitcore3.trezor.io/'] },
    
    { id: "btg1", name: "bitcoin gold legacy", simpleName: "bitcoin gold", short: "BTG", txType: "Bgold", bip44: [49, 156], addressVersion: 5, bitcore: ['https://btg1.trezor.io', 'https://btg2.trezor.io', 'https://btg3.trezor.io', 'https://btg4.trezor.io', 'https://btg5.trezor.io'] },
    { id: "btg3", name: "bitcoin gold", simpleName: "bitcoin gold", short: "BTG", txType: "Bgold", bip44: [44, 156], addressVersion: 5, bitcore: ['https://btg1.trezor.io', 'https://btg2.trezor.io', 'https://btg3.trezor.io', 'https://btg4.trezor.io', 'https://btg5.trezor.io'] },
    
    //{ id: "btc2x1", name: "bitcoin2x, 1-address", simpleName: "bitcoin2x", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 5, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    //{ id: "btc2x3", name: "bitcoin2x, 3-address", simpleName: "bitcoin2x", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 5, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    //{ id: "btc2xX", name: "bitcoin2x, wrongly generated 1-address (XPUB)", simpleName: "bitcoin2x", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 0, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
    //{ id: "btc2xM", name: "bitcoin2x, M-address", simpleName: "bitcoin", short: "BTC", txType: "Bitcoin", bip44: [49, 0], addressVersion: 5, bitcore: ['https://btc-bitcore1.trezor.io/', 'https://btc-bitcore3.trezor.io/'] },
 ];

const fromAccounts = [
    //accounts[1],
    //accounts[4],
    //accounts[5],
    accounts[2],
    accounts[3],
]

const claimable = {
    "btc1": [
        { id: "bch1" },
        { id: "ltc3" },
        
    ],
    "btc3": [
        { id: "bch1" },
        //{ id: "btc2x1" },
        //{ id: "btc2x3" },
        { id: "ltc3"},
        { id: "btcX" },
        //{ id: "btc2xX" },
    ],
    "bch1": [
        { id: "btc1" },
        //{ id: "btc2x1" },
        { id: "btc3", possible: false },
        { id: "btg", possible: false },
        //{ id: "btc2x3", possible: false },
        { id: "ltc3", possible: false }
    ],
    "ltc3": [
        { id: "btc3" },
        { id: "btcM" },
        //{ id: "btc2x3" },
        //{ id: "btc2xM" },
    ],
    // "btc2x1": [
    //     { id: "btc1" },
    //     { id: "btc3" },
    //     { id: "ltc3" },
    //     { id: "bch1" },
    //     { id: "btcX" },
    //     { id: "btc2xX" },
    // ],
    "btg1": [
        { id: "btc1"},
        { id: "btc3"},
    ],
    "btg3": [
        { id: "btc3"},
        { id: "btc1"},
    ]
}

const findAccountById = (id) => {
    for (let item of accounts) {
        if(item.id === id) return item;
    }
}

const findClaimableById = (id) => {
    for (let item in claimable) {
        if (item === id) {
            let destinationAccounts = [];
            for (let account of claimable[item]) {
                const destination = findAccountById(account.id);
                if (account.possible === false) {
                    destination.possible = false;
                } else {
                    delete destination.possible;
                }
                destinationAccounts.push(destination)
            }
            return destinationAccounts;
        }
    }
}

export default class HomeComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            ...initalState
        };
        this.selectAccount("origin", fromAccounts[1]);
    }

    selectAccount(type, account) {
        if (type === "origin") {
            const claimable = findClaimableById(account.id);
            this.setState({
                originAccount: account,
                destinationAccount: claimable[0],
                destinationOptions: claimable
            });
        } else {
            const claimable = findClaimableById('btg1');
            this.setState({
                originAccount: account.id === 'btc1' ? accounts[2] : accounts[3],
                destinationAccount: account,
            });
        }

        // shitcoins for president
    }

    render(props) {

        const { originAccount, destinationAccount, destinationOptions } = this.state;

        let button = (<button onClick={ () => { props.click(originAccount, destinationAccount) } } disabled={ !props.block }>Connect with TREZOR</button>);
        let warning = null;
        if (destinationAccount.possible === false) {
            button = true;
            warning = (
                <div className="warning">
                    Unfortunately, it is not possible to recover { originAccount.name } from { destinationAccount.name } address.<br/>
                    Segwit is not activated on the Bitcoin Cash network, and hence the coins cannot be spent securely.
                </div>
            )
        }

        return (
            <section className="component-home">
                <h3>Claiming Bitcoin Gold</h3>
                <Message
                    header="Reading of accounts failed."
                    error={ props.error }
                    hideError={ props.hideError } />
                <fieldset>
                    
                    
                    <p>This tool allows you to claim your Bitcoin Gold (BTG) from your TREZOR Wallet, assuming you had bitcoins (BTC) on your TREZOR before blockheight 491407 (around October 24).</p>
                    <p>BTC and BTG are completely independent and separate currencies. A transaction sent on one chain will not affect the other one.<br/>This applies to this claim tool too; your BTC will not be affected.</p>
                    <p className="nl-form">
                        <span>Please select the type of your account to claim from:</span>
                        {/* <SelectComponent 
                            type="origin"
                            useName="simpleName"
                            selected={ originAccount }
                            options= { fromAccounts }
                            onSelect={ this.selectAccount.bind(this) }
                            />
                        <span> from </span> */}
                        <SelectComponent 
                            type="destination"
                            selected={ destinationAccount }
                            options= { destinationOptions }
                            onSelect={ this.selectAccount.bind(this) }
                            />
                    </p>
                    <div className="button-wrapper">
                        { warning }
                        { button }
                    </div>
                </fieldset>
            </section>
        );
    }
}