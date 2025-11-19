import React from 'react';
import './CatCard.css';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';

function CatCard({ cat, userProgress, mode, onClick, onCheckboxToggle, isSelected }) {
    
    const isOwned = !!userProgress;
    
    let displayedForm = null;
    if (isOwned && userProgress.form_id) {
        // [FIX] Use loose equality (==) to handle string vs int mismatch
        displayedForm = cat.forms.find(f => f.form_id == userProgress.form_id);
    }
    
    if (!displayedForm) {
        displayedForm = cat.forms.find(f => f.form_id == 1) || cat.forms[0];
    }
    
    const iconUrl = IMAGE_BASE_URL + displayedForm?.icon_url;

    const cardClass = [
        'cat-card',
        isOwned ? 'is-owned' : 'is-missing',
        isSelected ? 'is-selected' : '',
        mode === 'bulk-edit' ? 'mode-bulk-edit' : 'mode-view'
    ].join(' ');
    
    return (
        <div className={cardClass} onClick={onClick}>
            {mode === 'bulk-edit' && (
                <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={(e) => {
                        e.stopPropagation();
                        onCheckboxToggle();
                    }}
                    className="cat-card-checkbox"
                />
            )}
            
            <img 
                src={iconUrl} 
                alt={displayedForm?.form_name} 
                loading="lazy" 
                className="cat-card-icon"
            />

            <div className="cat-card-info">
                <span className="cat-card-name">{displayedForm?.form_name}</span>
                {isOwned && (
                    <span className="cat-card-level">
                        Lvl: {userProgress.level}+{userProgress.plus_level}
                    </span>
                )}
            </div>
        </div>
    );
}

export default CatCard;