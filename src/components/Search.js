import { useState } from 'react';

const Search = ({ homes, setFilteredHomes }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const searchHandler = () => {
        if (searchTerm.trim() === '') {
            // If search is empty, show all homes
            setFilteredHomes(homes);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = homes.filter(home => {
            // Search in address
            if (home.address.toLowerCase().includes(term)) return true;
            
            // Search in attributes (bedrooms, bathrooms, etc.)
            for (let attribute of home.attributes) {
                if (attribute.trait_type.toLowerCase().includes(term) ||
                    attribute.value.toString().toLowerCase().includes(term)) {
                    return true;
                }
            }
            
            return false;
        });
        
        setFilteredHomes(filtered);
    };

    return (
        <header>
            <div className="header__content">
                <h2 className="header__title">Find Your Dream Property</h2>
                <p className="header__subtitle">Discover the perfect home with our blockchain-powered real estate marketplace</p>
                <div className="search__container">
                    <input
                        type="text"
                        className="header__search"
                        placeholder="Enter an address, neighborhood, city, or ZIP code"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchHandler()}
                    />
                    <button className="search__button" onClick={searchHandler}>Search</button>
                </div>
            </div>
        </header>
    );
}

export default Search;