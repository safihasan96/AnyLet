import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, documentId, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import useSavedProperties from '../hooks/useSavedProperties';
import logger from '../utils/logger';
import Container from '../components/layout/Container';
import Grid from '../components/layout/Grid';
import PropertyCard, { PropertyCardSkeleton } from '../components/patterns/PropertyCard';
import { EmptyState, Button, Icon } from '../components/ui';

// ✅ F-08: max 10 per 'in' batch (Firestore limit) × up to 10 batches = 100 max favorites
const FAVORITES_BATCH_SIZE = 10;
const MAX_FAVORITES_BATCHES = 10;

export default function Favorites() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { savedProperties, loading: hookLoading, toggleSaveProperty, isPropertySaved } = useSavedProperties();

  useEffect(() => {
    if (!currentUser || hookLoading) return;

    async function fetchFavorites() {
      if (savedProperties.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      try {
        const allIds = savedProperties.slice(0, FAVORITES_BATCH_SIZE * MAX_FAVORITES_BATCHES);
        const batches = [];
        for (let i = 0; i < allIds.length; i += FAVORITES_BATCH_SIZE) {
          batches.push(allIds.slice(i, i + FAVORITES_BATCH_SIZE));
        }
        let fetchedProperties = [];
        for (const batch of batches) {
          const q = query(collection(db, 'properties'), where(documentId(), 'in', batch), limit(FAVORITES_BATCH_SIZE));
          const querySnapshot = await getDocs(q);
          const props = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          fetchedProperties = [...fetchedProperties, ...props];
        }
        setFavorites(fetchedProperties);
      } catch (error) {
        logger.error('Error fetching favorite properties:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFavorites();
  }, [currentUser, hookLoading, savedProperties]);

  const busy = loading || hookLoading;

  return (
    <div className="min-h-screen bg-bg pb-24">
      <Container size="wide" className="pt-[max(env(safe-area-inset-top),1.5rem)] md:pt-10">
        <header className="mb-6">
          <h1 className="font-display text-display-md text-content">Saved properties</h1>
          <p className="mt-1 text-body-sm text-muted">Homes you’ve hearted for later.</p>
        </header>

        {busy ? (
          <Grid cols={3} gap="md">{Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}</Grid>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={<Icon name="favorite" />}
            title="No saved properties yet"
            description="Tap the heart on any listing to save it here for later."
            action={<Button onClick={() => navigate('/search')} leftIcon={<Icon name="search" />}>Explore properties</Button>}
          />
        ) : (
          <Grid cols={3} gap="md">
            {favorites.map((property) => (
              <PropertyCard key={property.id} property={property} saved={isPropertySaved(property.id)} onToggleSave={toggleSaveProperty} />
            ))}
          </Grid>
        )}
      </Container>
    </div>
  );
}
