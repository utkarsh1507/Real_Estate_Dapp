import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

// Function to help users add their NFT to MetaMask
const addNFTToMetaMask = async (tokenId, contractAddress) => {
    try {
        // Check if MetaMask is installed
        if (!window.ethereum) {
            console.log('MetaMask is not installed. Please install MetaMask to view your NFTs.');
            return;
        }
        
        // Get token URI to get metadata
        console.log('\n=== HOW TO VIEW YOUR PROPERTY IN METAMASK ===');
        console.log('1. Open your MetaMask wallet');
        console.log('2. Go to the "NFTs" tab');
        console.log('3. Click "Import NFTs"');
        console.log('4. Enter the following information:');
        console.log(`   - Contract Address: ${contractAddress}`);
        console.log(`   - Token ID: ${tokenId}`);
        console.log('5. Click "Import"');
        console.log('Your property should now be visible in your MetaMask wallet!');
        
        // Attempt to add the NFT automatically if the wallet supports it
        try {
            await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC721',
                    options: {
                        address: contractAddress,
                        tokenId: tokenId.toString()
                    },
                },
            });
            console.log('NFT has been added to your wallet automatically!');
        } catch (error) {
            console.log('Could not add NFT automatically. Please follow the manual steps above.');
        }
    } catch (error) {
        console.error('Error adding NFT to MetaMask:', error);
    }
};

const Home = ({ home, provider, account, escrow, realEstate, togglePop }) => {
    // Use the passed realEstate contract or initialize it if not provided
    const [localRealEstate, setLocalRealEstate] = useState(realEstate || null)
    const [transactionPending, setTransactionPending] = useState(false)
    const [hasBought, setHasBought] = useState(false)
    const [hasLended, setHasLended] = useState(false)
    const [hasInspected, setHasInspected] = useState(false)
    const [hasSold, setHasSold] = useState(false)

    const [buyer, setBuyer] = useState(null)
    const [lender, setLender] = useState(null)
    const [inspector, setInspector] = useState(null)
    const [seller, setSeller] = useState(null)

    const [owner, setOwner] = useState(null)

    const fetchDetails = async () => {
        // -- Buyer

        const buyer = await escrow.buyer(home.id)
        setBuyer(buyer)

        const hasBought = await escrow.approval(home.id, buyer)
        setHasBought(hasBought)

        // -- Seller

        const seller = await escrow.seller()
        setSeller(seller)

        const hasSold = await escrow.approval(home.id, seller)
        setHasSold(hasSold)

        // -- Lender

        const lender = await escrow.lender()
        setLender(lender)

        const hasLended = await escrow.approval(home.id, lender)
        setHasLended(hasLended)

        // -- Inspector

        const inspector = await escrow.inspector()
        setInspector(inspector)

        const hasInspected = await escrow.inspectionPassed(home.id)
        setHasInspected(hasInspected)
    }

    const fetchOwner = async () => {
        if (await escrow.isListed(home.id)) return

        const owner = await escrow.buyer(home.id)
        setOwner(owner)
    }

    const buyHandler = async () => {
        try {
            setTransactionPending(true);
            
            // Check if provider and escrow are properly initialized
            if (!provider) {
                throw new Error('Blockchain provider not initialized');
            }
            
            if (!escrow || !escrow.address) {
                throw new Error('Escrow contract not properly initialized');
            }
            
            // Use the prop or local state, whichever is available
            const activeRealEstate = realEstate || localRealEstate;
            if (!activeRealEstate || !activeRealEstate.address) {
                throw new Error('RealEstate contract not properly initialized');
            }
            
            // Get the signer
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
            console.log('User address:', userAddress);
            console.log('Escrow contract address:', escrow.address);
            console.log('RealEstate contract address:', activeRealEstate.address);
            
            // Check if property is already listed in escrow
            let isListed = false;
            try {
                isListed = await escrow.isListed(home.id);
                console.log('Property listed status:', isListed);
            } catch (error) {
                console.log('Error checking if property is listed:', error.message);
            }
            
            // Convert ETH price to wei
            const purchasePrice = ethers.utils.parseEther(home.attributes[0].value.toString());
            const escrowAmount = purchasePrice.div(10); // 10% of purchase price as escrow
            
            console.log('Purchase price:', ethers.utils.formatEther(purchasePrice), 'ETH');
            console.log('Escrow amount:', ethers.utils.formatEther(escrowAmount), 'ETH');
            
            // If property is not listed yet, we need to list it first
            // In a real-world scenario, this would be done by the seller, not the buyer
            // We're simulating this for demo purposes
            if (!isListed) {
                console.log('Property not listed yet. Listing property first...');
                
                // First, we need to make sure the NFT is approved for transfer
                try {
                    // Check who owns the NFT currently
                    const currentOwner = await activeRealEstate.ownerOf(home.id);
                    console.log('Current NFT owner:', currentOwner);
                    
                    // If we're not the owner, we need to get approval
                    if (currentOwner.toLowerCase() !== userAddress.toLowerCase()) {
                        console.log('You are not the owner of this NFT. In a real scenario, the seller would need to list it.');
                        // For demo purposes, we'll assume the property is already listed
                    } else {
                        // We are the owner, so we can list it
                        console.log('You own this NFT. Approving transfer to escrow contract...');
                        
                        // Approve the escrow contract to transfer the NFT
                        const approveTx = await activeRealEstate.connect(signer).approve(
                            escrow.address,
                            home.id
                        );
                        await approveTx.wait();
                        console.log('Escrow contract approved to transfer NFT');
                        
                        // List the property
                        const listTx = await escrow.connect(signer).list(
                            home.id,
                            userAddress, // buyer (ourselves for demo)
                            purchasePrice,
                            escrowAmount
                        );
                        await listTx.wait();
                        console.log('Property successfully listed in escrow');
                        isListed = true;
                    }
                } catch (error) {
                    console.log('Error during listing process:', error.message);
                    // Continue anyway for demo purposes
                }
            }
            
            // STEP 1: Deposit earnest money
            console.log('Depositing earnest money...');
            let transaction = await escrow.connect(signer).depositEarnest(home.id, { 
                value: escrowAmount
            });
            await transaction.wait();
            console.log('Earnest money deposited successfully');
            
            // STEP 2: Buyer approves the sale
            console.log('Buyer approving sale...');
            transaction = await escrow.connect(signer).approveSale(home.id, {
                gasLimit: 500000
            });
            await transaction.wait();
            console.log('Sale approved by buyer successfully');
            
            // STEP 3: Simulate inspection approval (in a real scenario, this would be done by the inspector)
            console.log('Simulating inspection approval...');
            transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true, {
                gasLimit: 500000
            });
            await transaction.wait();
            console.log('Inspection approved successfully');
            
            // STEP 4: Simulate seller approval (in a real scenario, this would be done by the seller)
            console.log('Simulating seller approval...');
            transaction = await escrow.connect(signer).approveSale(home.id, {
                gasLimit: 500000
            });
            await transaction.wait();
            console.log('Sale approved by seller successfully');
            
            // STEP 5: Simulate lender approval (in a real scenario, this would be done by the lender)
            console.log('Simulating lender approval...');
            transaction = await escrow.connect(signer).approveSale(home.id, {
                gasLimit: 500000
            });
            await transaction.wait();
            console.log('Sale approved by lender successfully');
            
            // STEP 6: Send the remaining funds to the escrow contract
            const lendAmount = purchasePrice.sub(escrowAmount);
            console.log('Sending remaining funds:', ethers.utils.formatEther(lendAmount), 'ETH');
            
            transaction = await signer.sendTransaction({
                to: escrow.address,
                value: lendAmount,
                gasLimit: 500000
            });
            await transaction.wait();
            console.log('Remaining funds sent successfully');
            
            // STEP 7: Finalize the sale
            console.log('Finalizing sale...');
            transaction = await escrow.connect(signer).finalizeSale(home.id, {
                gasLimit: 500000
            });
            await transaction.wait();
            console.log('Sale finalized successfully');
            
            // Verify the new owner
            try {
                const newOwner = await activeRealEstate.ownerOf(home.id);
                console.log('New property owner:', newOwner);
                if (newOwner.toLowerCase() === userAddress.toLowerCase()) {
                    console.log('SUCCESS: Property successfully transferred to buyer!');
                    
                    // Add the NFT to MetaMask
                    await addNFTToMetaMask(home.id, activeRealEstate.address);
                }
            } catch (error) {
                console.log('Error getting new owner:', error.message);
            }
            
            // Update UI
            setHasBought(true);
            
            alert('Purchase completed! The property has been transferred to your wallet. Check the console for instructions on how to view it in MetaMask.');
        } catch (error) {
            console.error('Error during purchase:', error);
            alert('Error during purchase: ' + (error.message || 'Unknown error'));
        } finally {
            setTransactionPending(false);
        }
    }

    const inspectHandler = async () => {
        try {
            const signer = await provider.getSigner()

            // Inspector updates status
            console.log('Updating inspection status...')
            const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true)
            await transaction.wait()
            console.log('Inspection passed')

            setHasInspected(true)
            alert('Inspection has been approved!')
        } catch (error) {
            console.error('Error during inspection:', error)
            alert('Error during inspection: ' + (error.message || 'Unknown error'))
        }
    }

    const lendHandler = async () => {
        try {
            const signer = await provider.getSigner()

            // Lender approves the sale
            console.log('Lender approving sale...')
            const transaction = await escrow.connect(signer).approveSale(home.id)
            await transaction.wait()
            console.log('Sale approved by lender')

            // Calculate lending amount (purchase price minus escrow amount)
            const purchasePrice = await escrow.purchasePrice(home.id)
            const escrowAmount = await escrow.escrowAmount(home.id)
            const lendAmount = purchasePrice.sub(escrowAmount)
            
            console.log('Lending amount:', ethers.utils.formatEther(lendAmount), 'ETH')

            // Lender sends funds to contract
            console.log('Sending funds to escrow contract...')
            const fundingTx = await signer.sendTransaction({ 
                to: escrow.address, 
                value: lendAmount,
                gasLimit: 60000 
            })
            await fundingTx.wait()
            console.log('Funds sent to escrow contract')

            setHasLended(true)
            alert('Lending approved and funds transferred to escrow!')
        } catch (error) {
            console.error('Error during lending:', error)
            alert('Error during lending: ' + (error.message || 'Unknown error'))
        }
    }

    const sellHandler = async () => {
        try {
            const signer = await provider.getSigner()

            // Seller approves the sale
            console.log('Seller approving sale...')
            let transaction = await escrow.connect(signer).approveSale(home.id)
            await transaction.wait()
            console.log('Sale approved by seller')

            // Check if all parties have approved
            const buyerAddress = await escrow.buyer(home.id)
            const sellerAddress = await escrow.seller()
            const lenderAddress = await escrow.lender()
            
            const buyerApproved = await escrow.approval(home.id, buyerAddress)
            const sellerApproved = await escrow.approval(home.id, sellerAddress)
            const lenderApproved = await escrow.approval(home.id, lenderAddress)
            const inspectionPassed = await escrow.inspectionPassed(home.id)
            
            console.log('Approvals status:', { buyerApproved, sellerApproved, lenderApproved, inspectionPassed })
            
            // Seller finalizes the sale (transfers ownership)
            console.log('Finalizing sale...')
            transaction = await escrow.connect(signer).finalizeSale(home.id)
            await transaction.wait()
            console.log('Sale finalized - property ownership transferred!')

            setHasSold(true)
            alert('Sale finalized! Property ownership has been transferred to the buyer.')
        } catch (error) {
            console.error('Error during sale finalization:', error)
            alert('Error during sale finalization: ' + (error.message || 'Unknown error'))
        }
    }

    // Initialize the RealEstate contract if not provided as prop
    const initializeRealEstateContract = async () => {
        try {
            // If we already have the realEstate contract from props, use that
            if (realEstate) {
                setLocalRealEstate(realEstate);
                console.log('Using provided RealEstate contract:', realEstate.address);
                return;
            }
            
            if (!provider) return;
            
            const network = await provider.getNetwork();
            const config = await import('../config.json');
            const RealEstate = await import('../abis/RealEstate.json');
            
            const realEstateContract = new ethers.Contract(
                config.default[network.chainId].realEstate.address,
                RealEstate.default,
                provider
            );
            
            setLocalRealEstate(realEstateContract);
            console.log('RealEstate contract initialized locally:', realEstateContract.address);
        } catch (error) {
            console.error('Error initializing RealEstate contract:', error);
        }
    }
    
    useEffect(() => {
        fetchDetails()
        fetchOwner()
        initializeRealEstateContract()
    }, [hasSold, provider])

    return (
        <div className="home">
            <div className='home__details'>
                <div className="home__image">
                    <img 
                        src={process.env.PUBLIC_URL + home.image} 
                        alt="Property" 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = process.env.PUBLIC_URL + '/images/placeholder.jpg';
                        }}
                    />
                </div>
                <div className="home__overview">
                    <h1>{home.name}</h1>
                    <div className="home__specs">
                        <span><i className="fas fa-ruler-combined"></i> <strong>{home.attributes[4].value}</strong> sqft</span>
                    </div>
                    <p className="home__address">{home.address}</p>

                    <div className="home__price">
                        <h2>{home.attributes[0].value} ETH</h2>
                        <span className="home__price-usd">(Approx. ${(home.attributes[0].value * 3000).toLocaleString()})</span>
                    </div>

                    {owner ? (
                        <div className='home__owned'>
                            Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
                        </div>
                    ) : (
                        <div className="home__actions">
                            {(account === inspector) ? (
                                <button className='home__buy' onClick={inspectHandler} disabled={hasInspected}>
                                    {hasInspected ? 'Inspection Approved ✓' : 'Approve Inspection'}
                                </button>
                            ) : (account === lender) ? (
                                <button className='home__buy' onClick={lendHandler} disabled={hasLended}>
                                    {hasLended ? 'Lending Approved ✓' : 'Approve & Lend'}
                                </button>
                            ) : (account === seller) ? (
                                <button className='home__buy' onClick={sellHandler} disabled={hasSold}>
                                    {hasSold ? 'Sale Approved ✓' : 'Approve & Sell'}
                                </button>
                            ) : (
                                <button className='home__buy' onClick={buyHandler} disabled={hasBought}>
                                    {hasBought ? 'Purchase In Progress ✓' : 'Buy Now'}
                                </button>
                            )}


                        </div>
                    )}

                    <hr />

                    <h2>Property Overview</h2>

                    <p className="home__description">
                        {home.description}
                    </p>

                    <hr />

                    <h2>Property Details</h2>

                    <ul className="home__features">
                        {home.attributes.map((attribute, index) => (
                            <li key={index}><strong>{attribute.trait_type}</strong>: {attribute.value}</li>
                        ))}
                    </ul>
                </div>

                <button onClick={togglePop} className="home__close">
                    <img src={close} alt="Close" />
                </button>
            </div>
        </div>
    );
}

export default Home;