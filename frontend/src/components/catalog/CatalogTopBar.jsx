import React from 'react';
import BaseButton from '../base/BaseButton.jsx';
import './CatalogTopBar.css'; // <-- Import the stylesheet

function CatalogTopBar({ 
    mode, 
    setMode, 
    filters, 
    setFilters, 
    sort, 
    setSort, 
    selectedBulkCount 
}) {

    const handleModeSwitch = () => {
        setMode(prevMode => (prevMode === 'view' ? 'bulk-edit' : 'view'));
    };
    const handleSearchChange = (e) => {
        setFilters(prevFilters => ({ ...prevFilters, search: e.target.value }));
    };
    const handleSortFieldChange = (e) => {
        setSort(prevSort => ({ ...prevSort, field: e.target.value }));
    };
    const handleSortDirectionToggle = () => {
        setSort(prevSort => ({ ...prevSort, direction: prevSort.direction === 'ASC' ? 'DESC' : 'ASC' }));
    };

    return (
        <div className="catalog-top-bar">
            
            <input 
                type="text"
                placeholder="Search for a cat..."
                value={filters.search}
                onChange={handleSearchChange}
                className="form-input"
            />

            <BaseButton variant="secondary" onClick={() => console.log('Open Filter Modal')}>
                [Icon] Filters
            </BaseButton>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <select 
                    value={sort.field} 
                    onChange={handleSortFieldChange}
                    className="form-select"
                >
                    <option value="cat_order_id">Cat Guide</option>
                    <option value="name">Name</option>
                    <option value="user_level">User Level</option>
                    <option value="rarity_id">Rarity</option>
                </select>
                
                <BaseButton 
                    variant="secondary" 
                    onClick={handleSortDirectionToggle}
                >
                    {sort.direction === 'ASC' ? '↑' : '↓'}
                </BaseButton>
            </div>

            <BaseButton 
                variant={mode === 'view' ? 'primary' : 'destructive'} 
                onClick={handleModeSwitch}
                className="btn-bulk-edit"
            >
                {mode === 'view' 
                    ? 'Bulk Edit' 
                    : `Done (${selectedBulkCount})`
                }
            </BaseButton>
        </div>
    );
}
export default CatalogTopBar;