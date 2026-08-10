import { Children, cloneElement, isValidElement, useCallback, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import BoundaryLock from './BoundaryLock';
import ViewportSync from './ViewportSync';
import createPricePin from './PricePin';
import createClusterIcon from './ClusterIcon';
import ListingPreviewCard from './ListingPreviewCard';
import NearMeButton from './NearMeButton';
import MapRecenter from './MapRecenter';

const BANGLADESH_BOUNDS = [[20.3756, 88.0075], [26.6382, 92.6804]];
const BANGLADESH_CENTER = [23.6850, 90.3563];
const MIN_ZOOM = 7;
const MAX_ZOOM = 18;
const DEFAULT_ZOOM = 7;

const TILE_LAYERS = {
    street: {
        label: 'Street',
        layers: [
            {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            },
        ],
    },
    satellite: {
        label: 'Satellite',
        layers: [
            {
                url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
                attribution: '© Google Maps',
            },
        ],
    },
    hybrid: {
        label: 'Hybrid',
        layers: [
            {
                url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
                attribution: '© Google Maps',
            },
        ],
    },
};

const SKELETON_CLUSTERS = [
    [23.8103, 90.4125],
    [22.3569, 91.7832],
    [24.8949, 91.8687],
    [24.3745, 88.6042],
    [22.8456, 89.5403],
    [22.7010, 90.3535],
];

function createSkeletonIcon() {
    return L.divIcon({
        className: '',
        html: '<div class="anylet-skeleton-cluster"></div>',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
    });
}

export default function MapView({
    allListings,
    listings,
    isLoading,
    selectedListingId,
    hoveredListingId,
    setSelectedListingId,
    setVisibleListings,
    setHasPanned,
    setCurrentBounds,
    showToast,
    activeLayer = 'street',
    flyToTarget,
    children,
}) {
    const skeletonIcon = useMemo(() => createSkeletonIcon(), []);
    const activeTileLayers = TILE_LAYERS[activeLayer]?.layers || TILE_LAYERS.street.layers;
    const createMemoPricePin = useCallback(
        (price, isActive) => createPricePin(price, isActive),
        []
    );
    const createMemoClusterIcon = useCallback(
        (cluster) => createClusterIcon(cluster),
        []
    );

    const overlayChildren = Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        return cloneElement(child);
    });

    return (
        <div className="relative h-full w-full overflow-hidden bg-[#F9FAFB]">
            <MapContainer
                center={BANGLADESH_CENTER}
                zoom={DEFAULT_ZOOM}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                maxBounds={BANGLADESH_BOUNDS}
                maxBoundsViscosity={1.0}
                zoomControl={false}
                attributionControl={true}
                className="h-full w-full"
            >
                <BoundaryLock
                    bounds={BANGLADESH_BOUNDS}
                    minZoom={MIN_ZOOM}
                    maxZoom={MAX_ZOOM}
                />
                {activeTileLayers.map((layer) => {
                    const tileLayerProps = {
                        url: layer.url,
                        attribution: layer.attribution,
                        maxZoom: 21,
                        maxNativeZoom: 20,
                    };

                    if (layer.pane) tileLayerProps.pane = layer.pane;

                    return (
                        <TileLayer
                            key={`${activeLayer}-${layer.url}`}
                            {...tileLayerProps}
                        />
                    );
                })}
                <ViewportSync
                    allListings={allListings}
                    setVisibleListings={setVisibleListings}
                    setHasPanned={setHasPanned}
                    setCurrentBounds={setCurrentBounds}
                />
                <MapRecenter targetLocation={flyToTarget} />
                <ZoomControl position="bottomright" />
                <NearMeButton showToast={showToast} />

                {isLoading && SKELETON_CLUSTERS.map((position) => (
                    <Marker key={position.join(',')} position={position} icon={skeletonIcon} interactive={false} />
                ))}

                {!isLoading && (
                    <MarkerClusterGroup
                        chunkedLoading={true}
                        maxClusterRadius={60}
                        spiderfyOnMaxZoom={true}
                        showCoverageOnHover={false}
                        zoomToBoundsOnClick={true}
                        iconCreateFunction={createMemoClusterIcon}
                    >
                        {listings.map((listing) => {
                            const isActive = hoveredListingId === listing.id || selectedListingId === listing.id;

                            return (
                                <Marker
                                    key={listing.id}
                                    position={[listing.lat, listing.lng]}
                                    icon={createMemoPricePin(listing.rent || listing.price, isActive)}
                                    eventHandlers={{
                                        click: () => setSelectedListingId(listing.id),
                                    }}
                                >
                                    <Popup maxWidth={220} className="anylet-popup">
                                        <ListingPreviewCard listing={listing} />
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MarkerClusterGroup>
                )}
            </MapContainer>

            {overlayChildren}
        </div>
    );
}
