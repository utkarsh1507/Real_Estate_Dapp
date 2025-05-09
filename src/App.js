import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';
import Team from './components/Team';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

// Local property data
import properties from './data/properties';

// Set document title
document.title = 'Real Estate Dapp';

function App() {
  const [provider, setProvider] = useState(null)
  const [escrow, setEscrow] = useState(null)
  const [realEstate, setRealEstate] = useState(null)

  const [account, setAccount] = useState(null)
  const [network, setNetwork] = useState(null)

  const [homes, setHomes] = useState([])
  const [filteredHomes, setFilteredHomes] = useState([])
  const [soldHomes, setSoldHomes] = useState([])
  const [home, setHome] = useState({})
  const [toggle, setToggle] = useState(false);
  const [loading, setLoading] = useState(true)
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('properties') // 'properties' or 'team'

  const loadBlockchainData = async () => {
    setLoading(true)
    try {
      console.log('Initializing blockchain connection...')
      
      // Initialize provider
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)
      
      // Get network
      const network = await provider.getNetwork()
      console.log('Connected to network:', network.name, '(Chain ID:', network.chainId, ')')
      setNetwork(network)
      
      // Check if we have configuration for this network
      if (!config[network.chainId]) {
        throw new Error(`No contract configuration found for network with Chain ID ${network.chainId}`)
      }
      
      // Check if user has already connected their wallet
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        const userAddress = ethers.utils.getAddress(accounts[0])
        setAccount(userAddress)
        console.log('Connected wallet address:', userAddress)
      } else {
        console.log('No wallet connected yet')
      }
      
      // Initialize contracts
      console.log('Initializing contracts...')
      console.log('RealEstate address:', config[network.chainId].realEstate.address)
      console.log('Escrow address:', config[network.chainId].escrow.address)
      
      const realEstateContract = new ethers.Contract(
        config[network.chainId].realEstate.address, 
        RealEstate, 
        provider
      )
      setRealEstate(realEstateContract)
      
      const escrowContract = new ethers.Contract(
        config[network.chainId].escrow.address, 
        Escrow, 
        provider
      )
      setEscrow(escrowContract)
      
      // Log contract initialization success
      console.log('Contracts initialized successfully')
      console.log('RealEstate contract:', realEstateContract.address)
      console.log('Escrow contract:', escrowContract.address)
      
      // Use local property data instead of fetching from IPFS
      setHomes(properties)
      setFilteredHomes(properties)
      
      // Check which properties are already sold
      const checkSoldProperties = async () => {
        try {
          const soldPropertiesIds = []
          
          // Check each property to see if it's still owned by the seller
          for (let i = 0; i < properties.length; i++) {
            try {
              const propertyId = properties[i].id
              const isListed = await escrowContract.isListed(propertyId)
              
              if (!isListed) {
                // If not listed, it might be sold
                const owner = await realEstateContract.ownerOf(propertyId)
                
                // If owner is not the seller, mark as sold
                if (owner.toLowerCase() !== config[network.chainId].seller.toLowerCase()) {
                  soldPropertiesIds.push(propertyId)
                }
              }
            } catch (error) {
              console.log(`Error checking property ${i}:`, error.message)
            }
          }
          
          // Update sold homes
          setSoldHomes(soldPropertiesIds)
          console.log('Sold properties:', soldPropertiesIds)
          
          // Update filtered homes to exclude sold properties
          const availableHomes = properties.filter(home => !soldPropertiesIds.includes(home.id))
          setFilteredHomes(availableHomes)
        } catch (error) {
          console.error('Error checking sold properties:', error)
        }
      }
      
      // Run the check
      checkSoldProperties()
      
      // Setup event listeners
      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length > 0) {
          const account = ethers.utils.getAddress(accounts[0])
          setAccount(account)
          console.log('Wallet changed to:', account)
        } else {
          // User disconnected wallet
          setAccount(null)
          console.log('Wallet disconnected')
        }
      })
      
      window.ethereum.on('chainChanged', () => {
        console.log('Network changed, refreshing...')
        window.location.reload()
      })
    } catch (error) {
      console.error('Error loading blockchain data:', error)
      alert(`Error connecting to blockchain: ${error.message}. Please make sure you're connected to the correct network and try again.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  const togglePop = (home) => {
    setHome(home)
    toggle ? setToggle(false) : setToggle(true);
  }

  return (
    <div className="app">
      <Navigation 
        account={account} 
        setAccount={setAccount} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      {activeTab === 'properties' && (
        <>
          <Search homes={homes} setFilteredHomes={setFilteredHomes} />

          <div className='cards__section' id="properties">
            <h3>Featured Properties</h3>

            {loading ? (
              <div className="loading">
                <p>Loading properties...</p>
                <div className="loading__spinner"></div>
              </div>
            ) : filteredHomes.length > 0 ? (
              <div className='cards'>
                {filteredHomes.map((home, index) => {
                  // Check if this property is sold
                  const isSold = soldHomes.includes(home.id);
                  
                  return (
                    <div 
                      className={`card ${isSold ? 'card--sold' : ''}`} 
                      key={index} 
                      onClick={() => !isSold && togglePop(home)}
                    >
                      <div className='card__image'>
                        {isSold && <div className="sold-overlay">SOLD</div>}
                        <img 
                          src={process.env.PUBLIC_URL + home.image} 
                          alt="Property" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = process.env.PUBLIC_URL + '/images/placeholder.jpg';
                          }}
                        />
                      </div>
                      <div className='card__info'>
                        <h4>{home.attributes[0].value} ETH</h4>
                        <p className='property-name'><strong>{home.name}</strong></p>
                        <p>{home.address}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-results">
                <p>No properties found matching your search criteria.</p>
                <button onClick={() => setFilteredHomes(homes)}>Show All Properties</button>
              </div>
            )}
          </div>
        </>
      )}
      
      {activeTab === 'team' && (
        <div className="team-container-wrapper">
          <Team />
        </div>
      )}

      <footer className="footer">
        <div className="footer__content">
          <div className="footer__brand">
            <h3>Real Estate Dapp</h3>
            <p>Blockchain-powered real estate marketplace</p>
          </div>
          <div className="footer__links">
            <div className="footer__column">
              <h4>Explore</h4>
              <ul>
                <li><a href="#">Properties</a></li>
                <li><a href="#">Marketplace</a></li>
                <li><a href="#">Resources</a></li>
              </ul>
            </div>
            <div className="footer__column">
              <h4>About</h4>
              <ul>
                <li><a href="#">Company</a></li>
                <li><a href="#">Team</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} Real Estate Dapp. Developed by Gaurav-Utkarsh & Amit</p>
        </div>
      </footer>

      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} realEstate={realEstate} togglePop={togglePop} />
      )}
    </div>
  );
}

export default App;
