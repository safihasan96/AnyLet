import { useNavigate } from 'react-router-dom';
import './CityGrid.css';

const cities = [
    { name: 'Dhaka', image: 'https://images.unsplash.com/photo-1608958435020-e855b0baa592?q=80&w=400&fit=crop' },
    { name: 'Chittagong', image: 'https://images.unsplash.com/photo-1627449553648-73b3793e82ce?q=80&w=400&fit=crop' },
    { name: 'Sylhet', image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=400&fit=crop' },
    { name: 'Rajshahi', image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=400&fit=crop' },
    { name: 'Khulna', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=400&fit=crop' },
    { name: 'Barishal', image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=400&fit=crop' },
    { name: 'Rangpur', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=400&fit=crop' },
    { name: 'Mymensingh', image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=400&fit=crop' },
    { name: 'Gazipur', image: 'https://images.unsplash.com/photo-1444723121867-76815aa08170?q=80&w=400&fit=crop' },
    { name: 'Narayanganj', image: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=400&fit=crop' },
    { name: 'Comilla', image: 'https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?q=80&w=400&fit=crop' },
    { name: 'Cox\'s Bazar', image: 'https://images.unsplash.com/photo-1599933391717-32b7245dd980?q=80&w=400&fit=crop' }
];

export default function CityGrid() {
    const navigate = useNavigate();

    const handleCityClick = (cityName) => {
        // Navigate to search and pass division query to filter
        navigate(`/search?division=${encodeURIComponent(cityName)}`);
    };

    return (
        <section className="city-grid-section container">
            <div className="city-grid-header">
                <h2>Find Your Home in Any City</h2>
                <p>Explore rentals across Bangladesh's top locations.</p>
            </div>

            <div className="city-grid-container fade-in">
                {cities.map((city) => (
                    <div
                        key={city.name}
                        className="city-card"
                        onClick={() => handleCityClick(city.name)}
                    >
                        <img loading="lazy" src={city.image} alt={city.name} className="city-image" />
                        <div className="city-overlay"></div>
                        <h3 className="city-name">{city.name}</h3>
                    </div>
                ))}
            </div>
        </section>
    );
}
