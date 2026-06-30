import L from 'leaflet';

export default function createClusterIcon(cluster) {
    const count = cluster.getChildCount();
    const size = count < 10 ? 36 : count < 50 ? 44 : 52;

    return L.divIcon({
        className: '',
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 9999px;
                background: #1a227f;
                color: #FFFFFF;
                font-weight: 700;
                font-size: 13px;
                border: 3px solid #FFFFFF;
                box-shadow: 0 2px 12px rgba(0,0,0,0.25);
            ">${count}</div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}
