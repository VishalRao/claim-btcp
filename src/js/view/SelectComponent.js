import { h, Component } from 'preact';

const initalState = {
    opened: false,
    touched: false
};

export default class NLFSelectComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            ...initalState
        };
    }

    onToggleClick(event) {
        event.preventDefault();
        event.stopPropagation();
        this.setState({
            opened: !this.state.opened
        });
    }

    onSelect(event, account) {
        event.preventDefault();
        event.stopPropagation();
        this.setState({
            opened: false,
            touched: true
        });
        this.props.onSelect(this.props.type, account);
    }

    render(props) {
        const { opened, touched } = this.state;
        const { selected, options, useName } = props;

        const nameField = useName === undefined ? "name" : useName;

        const cssPrefix = props.cssPrefix ? props.cssPrefix : 'nl-select';
        let selectClassName = cssPrefix;
        if (touched) selectClassName += ' touched';
        const toggleClassName = cssPrefix + '-toggle';

        let dropdown = null;
        let overlayClassName = cssPrefix + '-overlay';
        if (opened) {
            dropdown = (
                <ul>
                {
                    options.map((item) => 
                        <li onClick={ event => this.onSelect(event, item) } className={ item.id === selected.id ? "selected" : "" }>{ item[nameField] }</li>
                    )
                }
                </ul>
            );
            overlayClassName += ' opened';
        }
        
    
        return (
            <div className={ selectClassName } onClick={ event => this.onToggleClick(event) }>
                <div className={toggleClassName}>
                    <span>{ selected[nameField] }</span>
                </div>
                { dropdown }
                <div className={ overlayClassName } onClick={ event => this.onToggleClick(event) }></div>
            </div>
        );
    }
}