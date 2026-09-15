// Конфигурация и перманентные ассеты
const CONFIG = {
    repo: localStorage.getItem('gh_repo') || '',
    token: localStorage.getItem('gh_token') || '',
    permanent: {
        bg: 'bg-frame.png',
        brush: 'price-brush.png',
        drinkMarker: 'icon-drink-marker.png', // Иконка бензоколонки у цены
        snackMarker: 'icon-snack-marker.png', // Иконка гаечного ключа у цены
        energy: 'icon-energy.png'             // Молния для энергетика
    }
};

// Хранилище загруженных из GitHub кастомных иконок
let githubIcons = {
    drinks: [],
    snacks: []
};

// Наше состояние приложения (список строк товаров)
let itemsData = [
    { id: 1, title: 'Monster 0.33', price: '300', type: 'drinks', icon: '', isEnergy: true }
];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    renderItemRows();
    loadIconsFromGitHub();

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

// Сканирование репозитория GitHub через API
async function loadIconsFromGitHub() {
    if (!CONFIG.repo) return;
    
    const headers = CONFIG.token ? { 'Authorization': `token ${CONFIG.token}` } : {};
    const baseUrl = `https://github.com{CONFIG.repo}/contents`;

    try {
        // Сканируем папку с напитками (предполагается структура в репо: /icons/drinks и /icons/snacks)
        const drinksRes = await fetch(`${baseUrl}/icons/drinks`, { headers });
        if (drinksRes.ok) {
            const data = await drinksRes.json();
            githubIcons.drinks = data.filter(f => f.type === 'file').map(f => ({ name: f.name, url: f.download_url }));
        }

        // Сканируем папку со снеками
        const snacksRes = await fetch(`${baseUrl}/icons/snacks`, { headers });
        if (snacksRes.ok) {
            const data = await snacksRes.json();
            githubIcons.snacks = data.filter(f => f.type === 'file').map(f => ({ name: f.name, url: f.download_url }));
        }
        
        console.log('Ассеты успешно синхронизированы с GitHub:', githubIcons);
        renderItemRows(); // Перерисовываем, чтобы обновить названия выбранных иконок
    } catch (err) {
        alert('Ошибка сканирования репозитория GitHub. Проверьте путь и токен.');
        console.error(err);
    }
}

// Генерация строк интерфейса управления
function renderItemRows() {
    const container = document.getElementById('items-list');
    container.innerHTML = '';

    itemsData.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <div class="item-row-header">
                <span>Товар #${index + 1}</span>
                ${itemsData.length > 1 ? `<button class="btn btn-sm btn-danger" onclick="deleteRow(${item.id})">Удалить</button>` : ''}
            </div>
            <div class="item-main-fields">
                <input type="text" placeholder="Название товара" value="${item.title}" oninput="updateItemField(${item.id}, 'title', this.value)">
                <input type="text" placeholder="Цена" value="${item.price}" oninput="validateAndScalePrice(${item.id}, this)">
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

// Разрешаем вводить в поле цены исключительно цифры
function validateAndScalePrice(id, inputElement) {
    let sanitized = inputElement.value.replace(/\D/g, '');
    inputElement.value = sanitized;
    updateItemField(id, 'price', sanitized);
}

function updateItemField(id, field, value) {
    const item = itemsData.find(i => i.id === id);
    if (item) item[field] = value;
}

function updateItemType(id, type) {
    const item = itemsData.find(i => i.id === id);
    if (item) {
        item.type = type;
        item.icon = ''; // Сбрасываем иконку при смене категории
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

// Логика модального окна выбора иконок
let activeItemIdForIcon = null;

function openIconModal(itemId) {
    activeItemIdForIcon = itemId;
    const item = itemsData.find(i => i.id === itemId);
    const grid = document.getElementById('icons-grid');
    grid.innerHTML = '';

    const availableIcons = githubIcons[item.type] || [];
    
    if (availableIcons.length === 0) {
        grid.innerHTML = '<div style="grid-column: span 4; text-align:center; color:var(--text-muted); padding:20px;">Нет иконок в репозитории для этой категории.<br>Путь в репо должен быть: /icons/' + item.type + '</div>';
    }

    availableIcons.forEach(icon => {
        const cell = document.createElement('div');
        cell.className = 'icon-grid-item';
        cell.onclick = () => selectIconForActiveItem(icon.name);
        cell.innerHTML = `
            <img src="${icon.url}" alt="${icon.name}">
            <span>${icon.name}</span>
        `;
        grid.appendChild(cell);
    });

    document.getElementById('icon-modal').classList.add('open');
}

function closeModal() {
    document.getElementById('icon-modal').classList.remove('open');
}

function selectIconForActiveItem(iconName) {
    if (activeItemIdForIcon) {
        updateItemField(activeItemIdForIcon, 'icon', iconName);
        renderItemRows();
        closeModal();
    }
}

// Сборка структуры и экспорт ценника в PNG высокого качества
function buildRenderDOM() {
    const renderArea = document.getElementById('price-tag-render-area');
    renderArea.innerHTML = '';

    itemsData.forEach(item => {
        const tag = document.createElement('div');
        tag.className = 'single-tag';

        // Находим ссылку на выбранную иконку товара
        const currentCategoryIcons = githubIcons[item.type] || [];
        const foundIcon = currentCategoryIcons.find(i => i.name === item.icon);
        const iconSrc = foundIcon ? foundIcon.url : 'placeholder-icon.png';

        tag.innerHTML = `
            <div class="tag-header-zone">
                <img class="tag-product-icon" src="${iconSrc}">
                <div class="tag-title-block">
                    <div class="tag-title-text">${item.title || 'НАЗВАНИЕ'}</div>
                </div>
            </div>
            <div class="tag-bottom-zone">
                <div class="tag-meta-icons">
                    ${item.type === 'drinks' && item.isEnergy ? `<img class="icon-energy" src="${CONFIG.permanent.energy}">` : ''}
                    <img class="icon-type-marker" src="${item.type === 'drinks' ? CONFIG.permanent.drinkMarker : CONFIG.permanent.snackMarker}">
                </div>
                <div class="tag-price-badge">
                    <div class="tag-price-value">${item.price ? item.price + ' руб.' : '--- руб.'}</div>
                </div>
            </div>
        `;
        renderArea.appendChild(tag);
    });
}

function exportToPNG() {
    buildRenderDOM();
    
    const renderArea = document.getElementById('price-tag-render-area');
    
    // Даем небольшую задержку, чтобы изображения успели просчитаться в DOM
    setTimeout(() => {
        html2canvas(renderArea, {
            useCORS: true, // Важно для загрузки картинок с внешнего GitHub хостинга
            scale: 2,      // Повышаем плотность пикселей для идеального качества при печати
            backgroundColor: null
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'price-tags.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            alert('Ошибка генерации изображения. Убедитесь, что настроен CORS или скачаны ассеты.');
            console.error(err);
        });
    }, 500);
}
