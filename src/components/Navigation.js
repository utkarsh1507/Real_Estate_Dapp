import { ethers } from 'ethers';
import logo from '../assets/logo.svg';

const Navigation = ({ account, setAccount, activeTab, setActiveTab }) => {
    const connectHandler = async () => {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const account = ethers.utils.getAddress(accounts[0]);
            setAccount(account);
        } catch (error) {
            console.error('Error connecting wallet:', error);
        }
    }

    const disconnectHandler = () => {
        setAccount(null);
    }

    return (
        <nav>
            <ul className='nav__links'>
                <li>
                    <a 
                        href="#" 
                        className={activeTab === 'properties' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('properties');
                        }}
                    >
                        Properties
                    </a>
                </li>
                <li>
                    <a 
                        href="#" 
                        className={activeTab === 'marketplace' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('properties'); // Currently same as properties
                        }}
                    >
                        Marketplace
                    </a>
                </li>
                <li>
                    <a 
                        href="#" 
                        className={activeTab === 'team' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab('team');
                        }}
                    >
                        Team
                    </a>
                </li>
            </ul>

            <div className='nav__brand'>
                <img src={logo} alt="Logo" />
                <h1>Real Estate Dapp</h1>
            </div>

            {account ? (
                <button
                    type="button"
                    className='nav__connect nav__connected'
                    onClick={disconnectHandler}
                >
                    {account.slice(0, 6) + '...' + account.slice(38, 42)} ✓
                </button>
            ) : (
                <button
                    type="button"
                    className='nav__connect'
                    onClick={connectHandler}
                >
                    Connect Wallet
                </button>
            )}
        </nav>
    );
}

export default Navigation;