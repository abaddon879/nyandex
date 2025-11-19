import React, { useState, useEffect, useRef } from 'react';
import CatCard from './CatCard.jsx';
import BaseButton from '../base/BaseButton.jsx';
import './CatGallery.css';

const PAGE_SIZE = 50;

function CatGallery({ 
    mode, 
    catList, 
    userMap, 
    onCatSelect, 
    selectedBulkIds, 
    onBulkSelect  
}) {

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    // Track the last clicked ID for shift-select logic
    const lastClickedIdRef = useRef(null);

    useEffect(() => {
      setVisibleCount(PAGE_SIZE);
    }, [catList]);

    const handleBulkSelection = (catId, isShiftKey) => {
        if (isShiftKey && lastClickedIdRef.current !== null) {
            // 1. Find indices in the full filtered list
            const lastIndex = catList.findIndex(c => c.cat_id === lastClickedIdRef.current);
            const currentIndex = catList.findIndex(c => c.cat_id === catId);

            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                
                // 2. Get all IDs in range
                const rangeIds = catList.slice(start, end + 1).map(c => c.cat_id);
                
                // 3. Merge unique IDs
                onBulkSelect(prev => {
                    const newSet = new Set([...prev, ...rangeIds]);
                    return Array.from(newSet);
                });
            }
        } else {
            // Standard Toggle
            onBulkSelect(prevIds => {
                if (prevIds.includes(catId)) {
                    return prevIds.filter(id => id !== catId);
                } else {
                    return [...prevIds, catId];
                }
            });
        }
        
        // Update ref
        lastClickedIdRef.current = catId;
    };

    const handleCatClick = (catId, event) => {
        if (mode === 'view') {
            onCatSelect(catId);
        } else {
            // Pass the shift key state
            handleBulkSelection(catId, event.shiftKey);
        }
    };
    
    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + PAGE_SIZE);
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
                            onCheckboxToggle={(e) => {
                                // Handle direct checkbox clicks (prevent bubbling double triggers if necessary)
                                // If CatCard stops propagation, we might need logic here, 
                                // but usually onClick on the div is enough.
                                // We pass 'e' to detect shift key here too if needed.
                            }}
                            isSelected={isSelected}
                        />
                    );
                })}
            </div>

            {hasMore && (
                <div className="gallery-load-more">
                    <BaseButton onClick={handleLoadMore} variant="secondary">
                        Load More ({catList.length - visibleCount} remaining)
                    </BaseButton>
                </div>
            )}
        </div>
    );
}
export default CatGallery;