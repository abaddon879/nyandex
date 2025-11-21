import React, { useRef } from 'react'; // [FIX] Removed useState/useEffect imports
import CatCard from './CatCard.jsx';
import BaseButton from '../base/BaseButton.jsx';
import './CatGallery.css';

function CatGallery({ 
    mode, 
    catList, 
    userMap, 
    onCatSelect, 
    selectedBulkIds, 
    onBulkSelect,
    // [NEW] Props from parent
    visibleCount,
    onLoadMore
}) {
    
    // Track last clicked item for Shift+Select ranges
    const lastClickedIdRef = useRef(null);

    // [REMOVED] Internal state for visibleCount
    // [REMOVED] useEffect to reset visibleCount

    const handleBulkSelection = (catId, isShiftKey) => {
        if (isShiftKey && lastClickedIdRef.current !== null) {
            const lastIndex = catList.findIndex(c => c.cat_id === lastClickedIdRef.current);
            const currentIndex = catList.findIndex(c => c.cat_id === catId);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                
                const rangeIds = catList.slice(start, end + 1).map(c => c.cat_id);
                
                onBulkSelect(prev => {
                    const newSet = new Set([...prev, ...rangeIds]);
                    return Array.from(newSet);
                });
            }
        } else {
            onBulkSelect(prevIds => {
                if (prevIds.includes(catId)) {
                    return prevIds.filter(id => id !== catId);
                } else {
                    return [...prevIds, catId];
                }
            });
        }
        lastClickedIdRef.current = catId;
    };

    const handleCatClick = (catId, event) => {
        if (mode === 'view') {
            onCatSelect(catId);
        } else {
            handleBulkSelection(catId, event.shiftKey);
        }
    };
    
    if (catList.length === 0) {
        return (
            <div className="gallery-empty-state">
                <h3>[Icon] No Cats Found</h3>
                <p className="text-secondary">Try adjusting your filters.</p>
            </div>
        );
    }
    
    const catsToRender = catList.slice(0, visibleCount);
    const hasMore = catList.length > visibleCount;

    return (
        <div className="cat-gallery-container">
            <div className="cat-gallery-grid">
                {catsToRender.map(cat => {
                    const userProgress = userMap.get(cat.cat_id);
                    const isSelected = mode === 'bulk-edit' && selectedBulkIds.includes(cat.cat_id);
                    
                    return (
                        <CatCard
                            key={cat.cat_id}
                            cat={cat}
                            userProgress={userProgress}
                            mode={mode}
                            onClick={(e) => handleCatClick(cat.cat_id, e)}
                            onCheckboxToggle={() => {}}
                            isSelected={isSelected}
                        />
                    );
                })}
            </div>

            {hasMore && (
                <div className="gallery-load-more">
                    {/* [UPDATED] Use prop handler */}
                    <BaseButton onClick={onLoadMore} variant="secondary">
                        Load More ({catList.length - visibleCount} remaining)
                    </BaseButton>
                </div>
            )}
        </div>
    );
}
export default CatGallery;