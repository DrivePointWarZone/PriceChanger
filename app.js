const CONFIG = {
    repo: localStorage.getItem('gh_repo') || '',
    token: localStorage.getItem('gh_token') || '',
    permanent: {
        drinkMarker: 'icon-drink-marker.png', // Иконка бензоколонки
        snackMarker: 'icon-snack-marker.png',   // Иконка гаечного ключа
        energy: 'icon-energy.png'               // Молния
    }
};

let githubIcons = { drinks: [], snacks: [] };
let itemsData = [
    { id: 1, title: 'Monster 0.33', price: '300', type: 'drinks', icon: '', isEnergy: true }
];

document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    renderItemRows();
    if (CONFIG.repo) loadIconsFromGitHub();

    document.getElementById('add-item-btn').addEventListener('click', addNewRow);
    document.getElementById('sync-btn').addEventListener('click', saveSettingsAndSync);
    document.getElementById('export-btn').addEventListener('click', exportToPNG);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
});

function initSettings() {
    document.getElementById('gh-repo').value = CONFIG.repo;
    document.getElementById('gh-token').value = CONFIG.token;
}

function saveSettingsAndSync() {
    CONFIG.repo = document.getElementById('gh-repo').value.trim();
    CONFIG.token = document.getElementById('gh-token').value.trim();
    localStorage.setItem('gh_repo', CONFIG.repo);
    localStorage.setItem('gh_token', CONFIG.token);
    loadIconsFromGitHub();
}

async function loadIconsFromGitHub() {
    if (!CONFIG.repo) return;
    const headers = CONFIG.token ? { 'Authorization': `token ${CONFIG.token}` } : {};
    const baseUrl = `https://github.com{CONFIG.repo}/contents`;

    try {
        const drinksRes = await fetch(`${baseUrl}/icons/drinks`, { headers });
        if (drinksRes.ok) {
            const data = await drinksRes.json();
            githubIcons.drinks = data.filter(f => f.type === 'file').map(f => ({ name: f.name, url: f.download_url }));
        }
        const snacksRes = await fetch(`${baseUrl}/icons/snacks`, { headers });
        if (snacksRes.ok) {
            const data = await snacksRes.json();
            githubIcons.snacks = data.filter(f => f.type === 'file').map(f => ({ name: f.name, url: f.download_url }));
        }
        renderItemRows();
    } catch (err) {
        alert('Не удалось связаться с GitHub. Проверьте настройки репозитория.');
    }
}

function renderItemRows() {
    const container = document.getElementById('items-list');
    container.innerHTML = '';

    itemsData.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="item-row-header">
                <strong>Товар #${index + 1}</strong>
                ${itemsData.length > 1 ? `<button class="btn btn-sm btn-danger" onclick="deleteRow(${item.id})">✕</button>` : ''}
            </div>
            <div class="item-main-fields">
                <input type="text" placeholder="Название товара" value="${item.title}" oninput="updateItemField(${item.id}, 'title', this.value)">
                <input type="text" placeholder="Цена" value="${item.price}" oninput="validatePrice(${item.id}, this)">
            </div>
            <div class="item-selectors">
                <select onchange="updateItemType(${item.id}, this.value)">
                    <option value="drinks" ${item.type === 'drinks' ? 'selected' : ''}>Напиток</option>
                    <option value="snacks" ${item.type === 'snacks' ? 'selected' : ''}>Снек / Сладость</option>
                </select>
                <button class="btn-icon-select" onclick="openIconModal(${item.id})">
                    ${item.icon ? item.icon : 'Выбрать иконку...'}
                </button>
            </div>
            ${item.type === 'drinks' ? `
                <label class="checkbox-wrapper">
                    <input type="checkbox" ${item.isEnergy ? 'checked' : ''} onchange="updateItemField(${item.id}, 'isEnergy', this.checked)">
                    Доп. иконка энергетика (Молния)
                </label>
            ` : ''}
        `;
        container.appendChild(row);
    });
}

function validatePrice(id, input) {
    let digits = input.value.replace(/\D/g, ''); // Строго только цифры
    input.value = digits;
    updateItemField(id, 'price', digits);
}

function updateItemField(id, field, value) {
    const item = itemsData.find(i => i.id === id);
    if (item) item[field] = value;
}

function updateItemType(id, type) {
    const item = itemsData.find(i => i.id === id);
    if (item) {
        item.type = type;
        item.icon = '';
        item.isEnergy = false;
        renderItemRows();
    }
}

function addNewRow() {
    const newId = itemsData.length ? Math.max(...itemsData.map(i => i.id)) + 1 : 1;
    itemsData.push({ id: newId, title: '', price: '', type: 'drinks', icon: '', isEnergy: false });
    renderItemRows();
}

function deleteRow(id) {
    itemsData = itemsData.filter(i => i.id !== id);
    renderItemRows();
}

let activeItemIdForIcon = null;
function openIconModal(itemId) {
    activeItemIdForIcon = itemId;
    const item = itemsData.find(i => i.id === itemId);
    const grid = document.getElementById('icons-grid');
    grid.innerHTML = '';

    const availableIcons = githubIcons[item.type] || [];
    if (!availableIcons.length) {
        grid.innerHTML = '<div style="grid-column:span 4; text-align:center; color:var(--muted); padding:10px; font-size:12px;">Папка в репозитории пуста или не синхронизирована</div>';
    }

    availableIcons.forEach(icon => {
        const cell = document.createElement('div');
        cell.className = 'icon-grid-item';
        cell.onclick = () => { updateItemField(activeItemIdForIcon, 'icon', icon.name); renderItemRows(); closeModal(); };
        cell.innerHTML = `<img src="${icon.url}" crossOrigin="anonymous"><span>${icon.name}</span>`;
        grid.appendChild(cell);
    });
    document.getElementById('icon-modal').classList.add('open');
}

function closeModal() { document.getElementById('icon-modal').classList.remove('open'); }

function buildRenderDOM() {
    const renderArea = document.getElementById('price-tag-render-area');
    renderArea.innerHTML = '';

    itemsData.forEach(item => {
        const tag = document.createElement('div');
        tag.className = 'single-tag';

        const currentCategoryIcons = githubIcons[item.type] || [];
        const foundIcon = currentCategoryIcons.find(i => i.name === item.icon);
        
        const imgEl = document.createElement('img');
        imgEl.className = 'tag-product-icon';
        imgEl.crossOrigin = "anonymous"; // Снимаем защиту CORS при рендере
        imgEl.src = foundIcon ? foundIcon.url : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        tag.innerHTML = `
            <div class="tag-header-zone">
                <div class="tag-title-text">${item.title || 'НАЗВАНИЕ'}</div>
            </div>
            <div class="tag-bottom-zone">
                <div class="tag-meta-icons">
                    ${item.type === 'drinks' && item.isEnergy ? `<img class="icon-energy" src="${CONFIG.permanent.energy}" crossOrigin="anonymous">` : ''}
                    <img class="icon-type-marker" src="${item.type === 'drinks' ? CONFIG.permanent.drinkMarker : CONFIG.permanent.snackMarker}" crossOrigin="anonymous">
                </div>
                <div class="tag-price-container">
                    <div class="tag-price-value">${item.price ? item.price + ' руб.' : '--- руб.'}</div>
                </div>
            </div>
        `;
        tag.querySelector('.tag-header-zone').prepend(imgEl);
        renderArea.appendChild(tag);
    });
}

function exportToPNG() {
    buildRenderDOM();
    const renderArea = document.getElementById('price-tag-render-area');
    
    // Ждем отрисовки шрифтов и картинок перед генерацией
    setTimeout(() => {
        html2canvas(renderArea, {
            useCORS: true,
            allowTaint: false,
            scale: 2, 
            logging: false
        }).then(canvas => {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `price_tags_${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(err => {
            alert('Ошибка экспорта. Убедитесь, что все фоновые картинки находятся в одной папке с index.html');
        });
    }, 400);
}
