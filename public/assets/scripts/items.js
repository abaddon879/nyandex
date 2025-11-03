// Encapsulate state in an object to avoid global variables
const appState = {
    userItems: [],
    currentModalItem: null
};

// Fetch data and store it in appState
fetch(`${API_BASE_URL}/api/users/${userId}/items`, { method: 'GET', headers: { 'X-API-Key': apiKey } })
    .then(response => {
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return response.json();
    })
    .then(itemsData => {
        appState.userItems = itemsData; // Store the user items data
        console.log(`Items ${itemsData}`);
        populateSections(appState.userItems);
        addCollapseEventListeners();
        setupModal();
    })
    .catch(error => {
        console.error('Error:', error);
    });

function populateSections(data) {
    const sections = document.getElementById('item-sections');
    const types = Array.from(new Set(data.map(item => item.item_type)));

    types.forEach(type => {
        const section = document.createElement('section');
        section.id = type.toLowerCase();

        const header = document.createElement('h2');
        header.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Items`;
        header.classList.add('collapsed');

        const grid = document.createElement('div');
        grid.className = 'grid';

        data.filter(item => item.item_type === type).forEach(item => {
            const gridItem = document.createElement('div');
            
            gridItem.className = 'grid-item';
            gridItem.dataset.itemId = item.item_id;

            const src = `/assets/images/items/${item.image_url}`;
            const itemName = item.item_name;

            gridItem.innerHTML = `
                <span class="stack-top left" style="display:none">Upgrade</span>
                <button class="info-button">i</button>
                <img src="${src}" alt="${itemName}" title="${itemName}">
                <h4>${itemName}</h4>
                <div class="quantity">
                    <label>
                        Quantity
                        <input type="number" min="0" value="${item.item_qty ?? 0}" onchange="updateItemQuantity(${item.item_id}, this.value)" style="width: ${itemName === 'XP' ? '10ch' : '6ch'};">
                    </label>
                    <label>
                        Needed
                        <input type="number" min="0" value="${item.item_qty_required ?? 0}" style="width: ${itemName === 'XP' ? '10ch' : '6ch'};" disabled>
                    </label>
                </div>
            `;

            gridItem.querySelector('.info-button').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the image click
                openOrCloseModal(item);
            });

            grid.appendChild(gridItem);
        });

        section.appendChild(header);
        section.appendChild(grid);
        sections.appendChild(section);
    });
}

function updateModalElement(id, content) {
    const element = document.getElementById(id);
    element.textContent = content || '';
}

function updateModalImage(id, url, altText) {
    const img = document.getElementById(id);
    img.src = url || 'assets/images/default.png';
    img.alt = altText || '';
    img.title = altText || '';
}

function openOrCloseModal(item) {
    const modal = document.getElementById('item-modal');

    if (appState.currentModalItem === item) {
        modal.style.display = 'none';
        appState.currentModalItem = null;
    } else {
        updateModalElement('modal-id', `# ${String(item.item_id).padStart(3, '0')}`);
        updateModalElement('modal-name', item.item_name);
        updateModalImage('modal-image', `/images/items/${item.image_url}`);
        updateModalElement('modal-description', item.item_description);
        document.getElementById('modal-item-quantity').value = item.item_qty;
        modal.style.display = 'block';
        appState.currentModalItem = item;
    }
}

function closeModal() {
    const modal = document.getElementById('item-modal');
    modal.style.display = 'none';
    appState.currentModalItem = null;
}

function setupModal() {
    const modal = document.getElementById('item-modal');
    const span = document.getElementsByClassName('close')[0];

    span.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };
}

function addCollapseEventListeners() {
    document.querySelectorAll('section h2').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
            const grid = header.nextElementSibling;
            grid.style.display = header.classList.contains('collapsed') ? 'none' : 'grid';
        });
    });
}

document.getElementById('search').addEventListener('input', filterItems);

function filterItems() {
    const search = document.getElementById('search').value.toLowerCase();

    document.querySelectorAll('section h2').forEach(header => {
        header.classList.remove('collapsed');
        header.nextElementSibling.style.display = 'grid';
    });

    document.querySelectorAll('.grid-item').forEach(item => {
        const itemId = item.dataset.itemId;
        const itemData = appState.userItems.find(i => i.item_id === parseInt(itemId));
        const matchesSearch = itemData.item_name.toLowerCase().includes(search);
        item.style.display = matchesSearch ? '' : 'none';
    });
}

function updateItemQuantity(itemId, newQuantity) {
    const parsedQuantity = parseInt(newQuantity);
    
    // Find the item in the local state.
    const itemData = appState.userItems.find(item => item.item_id === itemId);

    // Case 1: The item's quantity in the local state is greater than 0.
    // This indicates the item already exists in the database.
    if (itemData && itemData.item_qty > 0) {
        // If the new quantity is 0, send a DELETE request.
        if (parsedQuantity === 0) {
            const requestUrl = `${API_BASE_URL}/api/users/${userId}/items/${itemId}`;
            fetch(requestUrl, {
                method: 'DELETE',
                headers: { 'X-API-Key': apiKey }
            })
            .then(response => {
                if (!response.ok) throw new Error(`Response status: ${response.status}`);
                console.log(`Item ${itemId} deleted successfully.`);
                itemData.item_qty = 0; // Update local state to reflect the change.
            })
            .catch(error => {
                console.error('Error deleting item:', error);
            });
        } 
        // If the new quantity is greater than 0, send a PATCH request.
        else {
            const requestBody = { item_qty: parsedQuantity };
            const requestUrl = `${API_BASE_URL}/api/users/${userId}/items/${itemId}`;
            fetch(requestUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                if (!response.ok) throw new Error(`Response status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log(`Item ${itemId} updated successfully`, data);
                itemData.item_qty = parsedQuantity; // Update local state.
            })
            .catch(error => {
                console.error('Error updating item:', error);
            });
        }
    } 
    // Case 2: The item exists in the local state but has a quantity of 0.
    // This indicates a new item that needs to be created in the database.
    else if (itemData && parsedQuantity > 0) {
        const requestBody = { item_id: itemId, item_qty: parsedQuantity };
        const requestUrl = `${API_BASE_URL}/api/users/${userId}/items`;

        fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) throw new Error(`Response status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log(`New item ${itemId} created successfully`, data);
            itemData.item_qty = parsedQuantity; // Update local state.
        })
        .catch(error => {
            console.error('Error creating item:', error);
        });
    }
}