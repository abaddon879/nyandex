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

const PAGE_SIZE = 50; 

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [userId, setUserId] = useState(authStore.getState().userId);
  const [mode, setMode] = useState('view');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data State
  const [masterCatList, setMasterCatList] = useState([]);
  const [userCatMap, setUserCatMap] = useState(new Map());
  const [readyToEvolveIds, setReadyToEvolveIds] = useState(new Set());

  // UI State
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [selectedBulkIds, setSelectedBulkIds] = useState([]);
  
  const [filters, setFilters] = useState(() => {
    const filterParam = searchParams.get('filter');
    return { 
      search: '', 
      rarity: [], 
      ownership: 'all', 
      // [UPDATED] Initialize new filter state
      status: { 
          readyToEvolve: filterParam === 'ready',
          hasEvolution: false 
      } 
    };
  });

  const [sort, setSort] = useState({ field: 'cat_order_id', direction: 'ASC' });

  // Reset visible count when filters/sort change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters, sort]);

  // URL Params Effect
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
  
  // Handlers
  const handleSelectAll = () => {
    const allIds = filteredCatList.map(cat => cat.cat_id);
    setSelectedBulkIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedBulkIds([]);
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PAGE_SIZE);
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
            
            visibleCount={visibleCount}
            onLoadMore={handleLoadMore}
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