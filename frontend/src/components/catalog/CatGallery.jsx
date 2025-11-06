import React, { useState, useEffect } from 'react';
import CatCard from './CatCard.jsx';
import BaseButton from '../base/BaseButton.jsx';
import './CatGallery.css'; // <-- Import the stylesheet

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

    useEffect(() => {
      setVisibleCount(PAGE_SIZE);
    }, [catList]);

    const handleToggleBulk = (catId) => {
        onBulkSelect(prevIds => {
            if (prevIds.includes(catId)) {
                return prevIds.filter(id => id !== catId);
            } else {
                return [...prevIds, catId];
            }
        });
    };

    const handleCatClick = (catId) => {
        if (mode === 'view') {
            onCatSelect(catId);
        } else {
            handleToggleBulk(catId);
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
                            onClick={() => handleCatClick(cat.cat_id)}
                            onCheckboxToggle={() => handleToggleBulk(cat.cat_id)}
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