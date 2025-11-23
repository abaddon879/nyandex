/**
 * Filters and sorts the master cat list based on user criteria.
 * @param {Array} masterCatList - The static list of ALL cats (from GET /cats)
 * @param {Object} userProgress - An object containing user data maps
 * @param {Map} userProgress.ownedCatMap - Map<cat_id, user_cat_object>
 * @param {Set} userProgress.readyCatIds - Set<cat_id>
 * @param {Object} filters - The current filter state (e.g., { search: 'macho', rarity: [0, 1] })
 * @param {Object} sort - The current sort state (e.g., { field: 'rarity_id', direction: 'DESC' })
 * @returns {Array} The filtered, sorted list of cats.
 */
export function filterAndSortCats(masterCatList, userProgress, filters, sort) {
  // Start with the full list
  let list = [...masterCatList];
  const ownedMap = userProgress.ownedCatMap || new Map();

  // --- 1. Filter by Search Query ---
  if (filters.search) {
    const query = filters.search.toLowerCase();
    list = list.filter(cat => {
      // Check the base cat name (which we'll add) or any form name
      const catName = cat.name || (cat.forms[0]?.form_name || '');
      return (
        catName.toLowerCase().includes(query) ||
        cat.forms.some(form => form.form_name.toLowerCase().includes(query))
      );
    });
  }

  // --- 2. Filter by Rarity ---
  if (filters.rarity && filters.rarity.length > 0) {
    const raritySet = new Set(filters.rarity);
    list = list.filter(cat => raritySet.has(cat.rarity_id));
  }

  // --- 3. Filter by Ownership ---
  if (filters.ownership && filters.ownership !== 'all') {
    list = list.filter(cat => {
      const isOwned = ownedMap.has(cat.cat_id);
      if (filters.ownership === 'owned') {
        return isOwned;
      }
      if (filters.ownership === 'missing') {
        return !isOwned;
      }
      return true;
    });
  }

  // --- 4. Filter by Status ---
  if (filters.status) {
      // A. Ready to Evolve (Calculated by Backend)
      if (filters.status.readyToEvolve) {
        const readyCatIds = userProgress.readyCatIds || new Set();
        list = list.filter(cat => readyCatIds.has(cat.cat_id));
      }

      // B. [NEW] Has Next Evolution (Has form > current form)
      if (filters.status.hasEvolution) {
        list = list.filter(cat => {
            const userCat = ownedMap.get(cat.cat_id);
            // Must be owned to have an evolution status
            if (!userCat) return false;

            // Current form ID (default to 1 if data missing)
            const currentFormId = userCat.form_id || 1;
            
            // Check if any form in the master list exists with ID > current
            return cat.forms.some(f => f.form_id > currentFormId);
        });
      }
  }

  // --- 5. Sorting ---
  if (sort.field) {
    const direction = sort.direction === 'DESC' ? -1 : 1;

    list.sort((a, b) => {
      let valA, valB;

      // Handle special sort fields
      switch (sort.field) {
        case 'user_level':
          // Get the user's level, default to 0 if not owned
          valA = ownedMap.get(a.cat_id)?.level || 0;
          valB = ownedMap.get(b.cat_id)?.level || 0;
          break;
        case 'name':
          // Sort by the first form's name
          valA = a.forms[0]?.form_name || '';
          valB = b.forms[0]?.form_name || '';
          break;
        default:
          // Default sort by properties on the base cat object
          valA = a[sort.field];
          valB = b[sort.field];
      }
      
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  }

  return list;
}