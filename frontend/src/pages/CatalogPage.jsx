import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authStore } from '../stores/authStore';
import { catService } from '../api/catService';
import { userTrackerService } from '../api/userTrackerService';
import { filterAndSortCats } from '../utils/CatFilterUtility.js';
import CatalogTopBar from '../components/catalog/CatalogTopBar.jsx';
import CatGallery from '../components/catalog/CatGallery.jsx';
import QuickEvoView from '../components/catalog/QuickEvoView.jsx';
import BulkActionFooter from '../components/catalog/BulkActionFooter.jsx';
import './CatalogPage.css';

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userId, setUserId] = useState(authStore.getState().userId);
  const [mode, setMode] = useState('view');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [masterCatList, setMasterCatList] = useState([]);
  const [userCatMap, setUserCatMap] = useState(new Map());
  const [readyToEvolveIds, setReadyToEvolveIds] = useState(new Set());

  // Initialize filters based on URL param
  const [filters, setFilters] = useState(() => {
    const filterParam = searchParams.get('filter');
    return { 
      search: '', 
      rarity: [], 
      ownership: 'all', 
      status: { readyToEvolve: filterParam === 'ready' } 
    };
  });

  const [sort, setSort] = useState({ field: 'cat_order_id', direction: 'ASC' });
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState([]);

  // Listen for URL changes (e.g. if clicking dashboard link while already on catalog)
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'ready') {
      setFilters(prev => ({
        ...prev,
        status: { ...prev.status, readyToEvolve: true }
      }));
    }
  }, [searchParams]);

  const fetchPageData = useCallback(async () => {
    if (!userId) return;
    if (masterCatList.length === 0) setIsLoading(true);
    setError(null);
    try {
      const [staticCats, userCats, dashboardData] = await Promise.all([
        catService.getCatList(),
        userTrackerService.getUserCats(userId),
        userTrackerService.getDashboardData(userId)
      ]);
      const progressMap = new Map();
      userCats.forEach(cat => progressMap.set(cat.cat_id, cat));
      const readyIds = new Set(dashboardData.ready_to_evolve.map(cat => cat.cat_id));
      
      setMasterCatList(staticCats);
      setUserCatMap(progressMap);
      setReadyToEvolveIds(readyIds);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]); 

  useEffect(() => {
    const unsubscribe = authStore.subscribe(state => setUserId(state.userId));
    if (userId) {
      fetchPageData();
    }
    return unsubscribe;
  }, [userId, fetchPageData]);

  const filteredCatList = useMemo(() => {
    return filterAndSortCats(
      masterCatList,
      { ownedCatMap: userCatMap, readyCatIds: readyToEvolveIds },
      filters,
      sort
    );
  }, [masterCatList, userCatMap, readyToEvolveIds, filters, sort]);
  
  // --- Bulk Selection Handlers ---

  const handleSelectAll = () => {
    // Select ALL cats currently matching the filters, not just the visible ones
    const allIds = filteredCatList.map(cat => cat.cat_id);
    setSelectedBulkIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedBulkIds([]);
  };

  if (isLoading && masterCatList.length === 0) return <div>Loading Catalog...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="catalog-page-container">
      <CatalogTopBar
        mode={mode}
        setMode={setMode}
        filters={filters}
        setFilters={setFilters}
        sort={sort}
        setSort={setSort}
        selectedBulkCount={selectedBulkIds.length}
      />
      <div className={`catalog-layout mode-${mode}`}>
        <div className="catalog-gallery-wrapper">
          <CatGallery
            mode={mode}
            catList={filteredCatList}
            userMap={userCatMap}
            onCatSelect={setSelectedCatId}
            selectedBulkIds={selectedBulkIds}
            onBulkSelect={setSelectedBulkIds}
          />
        </div>
        <aside className="catalog-sidebar-wrapper">
          <QuickEvoView
            key={selectedCatId}
            catId={selectedCatId}
            userMap={userCatMap}
            onDataChange={fetchPageData} 
          />
        </aside>
      </div>
      {mode === 'bulk-edit' && (
        <BulkActionFooter
          userId={userId}
          selectedBulkIds={selectedBulkIds}
          totalCount={filteredCatList.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onComplete={() => {
            fetchPageData();
            setSelectedBulkIds([]);
          }}
        />
      )}
    </div>
  );
}

export default CatalogPage;