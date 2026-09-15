import React, { useState, useEffect, useRef } from 'react';

// НАСТРОЙКА ГИТХАБА (Заполните своими данными)
const GITHUB_USER = "DrivePointWarZone";
const GITHUB_REPO = "PriceChanger";
const GITHUB_BRANCH = "main"; 

export default function App() {
  const [items, setItems] = useState([
    { id: 1, name: 'Monster 0.33', price: '300', type: 'drink', isEnergy: true, productIcon: null, volume: 'в асс' }
  ]);
  
  const [activePopup, setActivePopup] = useState(null); // id строки, где выбираем иконку
  const [availableIcons, setAvailableIcons] = useState({ drinks: [], snacks: [] });
  const [loadingIcons, setLoadingIcons] = useState(false);
  const previewRef = useRef(null);

  // Динамическое сканирование иконок из GitHub Репозитория
  useEffect(() => {
    async function fetchIconsFromGithub() {
      setLoadingIcons(true);
      try {
        const fetchFolder = async (path) => {
          const res = await fetch(`https://github.com{GITHUB_USER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`);
          if (!res.ok) return [];
          const data = await res.json();
          return data
            .filter(file => file.type === 'file' && /\.(png|jpeg|jpg|svg|webp)$/i.test(file.name))
            .map(file => ({ name: file.name, url: file.download_url }));
        };

        const drinksIcons = await fetchFolder('src/assets/drinks');
        const snacksIcons = await fetchFolder('src/assets/snacks');
        
        setAvailableIcons({ drinks: drinksIcons, snacks: snacksIcons });
      } catch (e) {
        console.error("Ошибка загрузки иконок с GitHub:", e);
      } finally {
        setLoadingIcons(false);
      }
    }
    if(GITHUB_USER !== "DrivePointWarZone") {
      fetchIconsFromGithub();
    }
  }, []);

  // Добавление новой строки товара
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      price: '',
      type: 'drink',
      isEnergy: false,
      productIcon: null,
      volume: ''
    };
    setItems([...items, newItem]);
  };

  // Удаление строки
  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Обновление полей с валидацией цены
  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'price') {
          // Разрешаем только цифры
          const cleanValue = value.replace(/\D/g, '');
          return { ...item, [field]: cleanValue };
        }
        if (field === 'type') {
          // При смене типа сбрасываем иконку продукта и чекбокс энергетика
          return { ...item, [field]: value, productIcon: null, isEnergy: false };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white font-sans antialiased pb-32">
      {/* Шапка в стиле iOS */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#16161a]/80 border-b border-[#24242b] px-4 py-4 flex justify-between items-center custom-safe-top">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-amber-400">Ценники генератор</h1>
          <p className="text-xs text-gray-400">Конструктор меню и прайсов</p>
        </div>
        <button 
          onClick={() => window.exportToPDF()} // Функция будет во 2-й части
          className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-amber-500/20"
        >
          Скачать PDF
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
        {/* Секция управления товарами */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-medium tracking-wider text-gray-400 uppercase">Список товаров</h2>
            <button 
              onClick={addItem}
              className="text-xs bg-[#1F1F24] hover:bg-[#2A2A32] border border-[#2F2F38] text-amber-400 px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-all"
            >
              <span>+ Добавить</span>
            </button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="bg-[#16161A] border border-[#24242B] rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-inner">
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <span className="text-[10px] text-gray-500 font-mono">#{index + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>

              {/* Название и Объем/Доп.текст */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="col-span-2">
                  <label className="text-[11px] text-gray-400 block mb-1">Название товара</label>
                  <input 
                    type="text" 
                    value={item.name} 
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    placeholder="Например: Coca Cola"
                    className="w-full bg-[#1F1F24] border border-[#2F2F38] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Объем / Доп</label>
                  <input 
                    type="text" 
                    value={item.volume} 
                    onChange={(e) => updateItem(item.id, 'volume', e.target.value)}
                    placeholder="0.33 / в асс"
                    className="w-full bg-[#1F1F24] border border-[#2F2F38] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Категория и Цена */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Категория</label>
                  <select 
                    value={item.type} 
                    onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                    className="w-full bg-[#1F1F24] border border-[#2F2F38] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                  >
                    <option value="drink">🥤 Напиток</option>
                    <option value="snack">🍫 Снек / Сладость</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Цена (только цифры)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      inputMode="numeric"
                      value={item.price} 
                      onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                      placeholder="250"
                      className="w-full bg-[#1F1F24] border border-[#2F2F38] rounded-xl pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₽</span>
                  </div>
                </div>
              </div>

              {/* Выбор индивидуальной иконки продукта + Чекбокс энергетика */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setActivePopup(item.id)}
                  className="bg-[#1F1F24] border border-[#2F2F38] hover:border-gray-500 px-3 py-2 rounded-xl text-xs flex items-center space-x-2 transition-all w-1/2 justify-center"
                >
                  {item.productIcon ? (
                    <>
                      <img src={item.productIcon.url} alt="" className="w-4 h-4 object-contain invert" />
                      <span className="truncate max-w-[80px]">{item.productIcon.name}</span>
                    </>
                  ) : (
                    <span className="text-amber-400">🔘 Выбрать иконку</span>
                  )}
                </button>

                {item.type === 'drink' && (
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={item.isEnergy} 
                      onChange={(e) => updateItem(item.id, 'isEnergy', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 bg-[#1F1F24] border border-[#2F2F38] peer-checked:bg-amber-500 peer-checked:border-amber-500 rounded-lg flex items-center justify-center transition-all peer-active:scale-95">
                      <svg className="w-3 h-3 text-black font-bold opacity-0 peer-checked:opacity-100" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                    <span className="text-xs text-gray-300">Энергетик (⚡️)</span>
                  </label>
                )}
              </div>
            </div>
