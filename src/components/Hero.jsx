import { useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
    const navigate = useNavigate();

    return (
        <section className="hero">
            <div className="container hero-content">
                <h1 className="hero-title">
                    Find Your Perfect Home in <span className="text-gradient">Bangladesh</span>
                </h1>
                <p className="hero-subtitle">
                    Discover thousands of apartments for long-term rent across Dhaka, Chattogram, and beyond.
                </p>

                <div className="search-box glass-panel">
                    <div className="search-inputs">
                        <div className="input-group">
                            <label>Location</label>
                            <input type="text" placeholder="e.g. Gulshan, Banani, Dhanmondi" />
                        </div>
                        <div className="divider"></div>
                        <div className="input-group">
                            <label>Property Type</label>
                            <select defaultValue="">
                                <option value="" disabled>Select Type</option>
                                <option value="apartment">Apartment</option>
                                <option value="duplex">Duplex</option>
                                <option value="room">Single Room</option>
                            </select>
                        </div>
                        <div className="divider"></div>
                        <div className="input-group">
                            <label>Max Rent (&#x9F3;)</label>
                            <input type="number" placeholder="&#x9F3; 50000" />
                        </div>
                    </div>
                    <button className="btn btn-primary search-btn" onClick={() => navigate('/search')}>Search</button>
                </div>
            </div>

            {/* Decorative background blobs */}
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
        </section>
    );
}
