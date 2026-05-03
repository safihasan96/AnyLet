import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SearchFilters from './pages/SearchFilters';
import PropertyDetails from './pages/PropertyDetails';
import LandlordDashboard from './pages/LandlordDashboard';
import AddPropertyStep1 from './pages/AddPropertyStep1';
import AddPropertyStep2 from './pages/AddPropertyStep2';
import ReviewPublish from './pages/ReviewPublish';
import ListingPublished from './pages/ListingPublished';

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-background-light dark:bg-background-dark relative shadow-2xl overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/filters" element={<SearchFilters />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/dashboard" element={<LandlordDashboard />} />
          <Route path="/add-property/1" element={<AddPropertyStep1 />} />
          <Route path="/add-property/2" element={<AddPropertyStep2 />} />
          <Route path="/review" element={<ReviewPublish />} />
          <Route path="/published" element={<ListingPublished />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
