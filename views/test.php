<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Display Cat Data in a Table</title>
    <style>
        img {
            max-width: 50px;
            height: auto;
        }
        input {
            width: 25px;
            padding: 2px;
            text-align: center;
            appearance: textfield;
        }
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    </style>
</head>
<body>

<h1>Cat Data</h1>

<table id="catTable">
    <thead>
        <tr>
            <th>Image</th>
            <th>Cat Name</th>
            <th>Level</th>
            <th>+ Level</th>
            <th>True Form</th>
            <th>Ultra Form</th>
        </tr>
    </thead>
    <tbody id="catTableBody">
        <!-- Dynamic content will be injected here -->
    </tbody>
</table>

<script>
    const userId = 6;
    const apiKey = '<?php echo $_ENV['API_KEY']; ?>';
    const url = `http://pat.localhost/api/users/${userId}/cats`;

    fetch(url, {
        method: 'GET',
        headers: { 'X-API-Key': apiKey },
    })
    .then(response => {
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        return response.json();
    })
    .then(createCatData)
    .catch(error => console.error(`Error:`, error));

    function createCatData(cats) {
        const tableBody = document.getElementById('catTableBody');

        cats.forEach(cat => {
            const row = document.createElement('tr');
            row.id = `cat_id_${cat.cat_id}`;

            row.append(
                createImageCell(cat),
                createNameCell(cat),
                createLevelCell(cat, 'user_cat_level', cat.max_level),
                createLevelCell(cat, 'user_cat_plus_level', cat.max_plus_level),
                createFormCheckbox(cat, 3, 'true_Form'),
                createFormCheckbox(cat, 4, 'ultra_Form', row.querySelector('input[id^="true_Form"]'))
            );

            tableBody.appendChild(row);
        });

        tableBody.addEventListener('change', handleInputChange);
    }

    function handleInputChange(event) {
        if (event.target.tagName !== 'INPUT') return;

        const row = event.target.closest('tr');
        const catId = parseInt(row.id.replace('cat_id_', ''));
        const catData = cats.find(cat => cat.cat_id === catId);

        let userLevel = parseInt(row.querySelector('input[id^="user_cat_level"]').value) || 0;
        let userPlusLevel = parseInt(row.querySelector('input[id^="user_cat_plus_level"]').value) || 0;
        let trueFormChecked = row.querySelector('input[id^="true_Form"]').checked;
        let ultraFormChecked = row.querySelector('input[id^="ultra_Form"]').checked;
        let formId = calculateFormId(catData, userLevel, userPlusLevel, trueFormChecked, ultraFormChecked);

        updateFormState(row, catData, userLevel, userPlusLevel, trueFormChecked);

        updateRowDisplay(row, catData, formId);

        const userUpdate = { cat_id: catId, user_cat_level: userLevel, user_cat_plus_level: userPlusLevel, form_id: formId };

        saveCatData(catData, userUpdate);
    }

    function calculateFormId(catData, userLevel, userPlusLevel, trueFormChecked, ultraFormChecked) {
        if (ultraFormChecked) return 4;
        if (trueFormChecked) return 3;
        if ((userLevel + userPlusLevel) >= 10) return 2;
        return 1;
    }

    function updateFormState(row, catData, userLevel, userPlusLevel) {
        const trueFormCheckbox = row.querySelector('input[id^="true_Form"]');
        const ultraFormCheckbox = row.querySelector('input[id^="ultra_Form"]');

        const tfLevel = catData.forms[2]?.required_level;
        const ufLevel = catData.forms[3]?.required_level;

        trueFormCheckbox.disabled = userLevel + userPlusLevel < tfLevel;
        ultraFormCheckbox.disabled = userLevel + userPlusLevel < ufLevel || !trueFormCheckbox.checked;
    }

    function updateRowDisplay(row, catData, formId) {
        const currentForm = catData.forms[formId - 1];
        row.querySelector('td img').src = `/images/units/${currentForm.image_url}`;
        row.cells[1].textContent = currentForm.form_name;
    }

    function saveCatData(catData, userUpdate) {
        const userInfoExists = catData.user_info && Object.values(catData.user_info).some(val => val !== null);
        const method = userInfoExists ? 'PATCH' : 'POST';
        const url = `http://pat.localhost/api/users/${userId}/cats${method === 'PATCH' ? '/' + userUpdate.cat_id : ''}`;

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(userUpdate),
        })
        .then(response => {
            if (!response.ok) throw new Error(`Response status: ${response.status}`);
            console.log(`${method} request successful`);

            updateCatInfo(catData, userUpdate, method);
        })
        .catch(error => console.error(`Error ${method}ing data:`, error));
    }

    function updateCatInfo(catData, userUpdate, method) {
        if (method === 'POST') {
            catData.user_info = { ...userUpdate };
        } else {
            Object.assign(catData.user_info, userUpdate);
        }
    }

    function createImageCell(cat) {
        const cell = document.createElement('td');
        const img = document.createElement('img');
        const currentForm = getCurrentForm(cat);
        img.src = `/images/units/${currentForm.image_url}`;
        img.alt = currentForm.form_name;
        cell.appendChild(img);
        return cell;
    }

    function createNameCell(cat) {
        const cell = document.createElement('td');
        cell.textContent = getCurrentForm(cat).form_name;
        return cell;
    }

    function createLevelCell(cat, levelKey, maxLevel) {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `${levelKey}_cat_id_${cat.cat_id}`;
        input.value = cat.user_info?.[levelKey] || 0;
        input.max = maxLevel;
        input.min = 0;
        cell.appendChild(input);
        return cell;
    }

    function createFormCheckbox(cat, formId, checkboxId, trueFormCheckbox = null) {
        const cell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `${checkboxId}_cat_id_${cat.cat_id}`;

        const form = cat.forms.find(f => f.form_id === formId);
        if (form) {
            const userTotalLevel = getUserTotalLevel(cat);
            const isStageUnlock = form.required_level === -1;

            checkbox.disabled = !(
                (isStageUnlock && userTotalLevel >= cat.forms[1].required_level) ||
                (!isStageUnlock && userTotalLevel >= form.required_level)
            );
            checkbox.checked = cat.user_info?.user_cat_form_id == formId;

            if (formId === 4) {
                checkbox.disabled = !(trueFormCheckbox?.checked && userTotalLevel >= form.required_level);
            }
        } else {
            checkbox.disabled = true;
        }

        cell.appendChild(checkbox);
        return cell;
    }

    function getCurrentForm(cat) {
        const userCatFormId = cat.user_info?.user_cat_form_id || 1;
        return cat.forms.find(form => form.form_id === parseInt(userCatFormId)) || cat.forms[0];
    }

    function getUserTotalLevel(cat) {
        const userCatLevel = cat.user_info?.user_cat_level || 0;
        const userCatPlusLevel = cat.user_info?.user_cat_plus_level || 0;
        return userCatLevel + userCatPlusLevel;
    }
</script>

</body>
</html>
