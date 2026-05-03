import { Link } from 'react-router-dom';
import './SearchCard.css';
import './LinkStyles.css';

export default function SearchCard({ property }) {
    const { id, title, rent, area, beds, tenantType, baths, sqft, image, type, verified, utilitiesCost, upazila, district } = property;

    return (
        <div className="search-card glass-panel">
            <Link to={`/property/${id}`} className="search-card-image-wrapper">
                <img src={image} alt={title} className="search-card-image" />
                <div className="property-badges-container">
                    <span className="badge badge-type">{type}</span>
                    {verified && <span className="badge badge-verified">✅ Verified</span>}
                </div>
            </Link>

            <div className="search-card-content">
                <div className="search-card-header">
                    <Link to={`/property/${id}`} className="property-title-link">
                        <h3 className="search-card-title">{title}</h3>
                    </Link>
                    <p className="search-card-location">📍 {upazila || area || 'Dhaka'}{district ? `, ${district}` : ''}</p>
                </div>

                {utilitiesCost > 0 && (
                    <div className="search-card-utility">
                        <span className="utility-label">Service Charge:</span>
                        <span className="utility-value">৳ {utilitiesCost.toLocaleString()}</span>
                    </div>
                )}

                <div className="search-card-details">
                    <div className="detail-item">
                        <span className="icon">🛏️</span>
                        <span>{beds} Bed</span>
                    </div>
                    <div className="detail-item">
                        <span className="icon">👤</span>
                        <span>{tenantType}</span>
                    </div>
                    <div className="detail-item">
                        <span className="icon">📐</span>
                        <span>{sqft || property.area || property.sqft || 'N/A'} sqft</span>
                    </div>
                </div>

                <div className="search-card-footer">
                    <div className="rent-info">
                        <span className="rent-amount">৳ {rent.toLocaleString()}</span>
                        <span className="rent-period">/month</span>
                    </div>

                    <Link to={`/property/${id}`} className="btn btn-primary view-details-btn">View Details</Link>
                </div>
            </div>
        </div>
    );
}
