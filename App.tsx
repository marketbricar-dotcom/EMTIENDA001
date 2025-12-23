
import React, { useState, useEffect, useRef } from 'react';
import { Package, ShoppingCart, BarChart3, Cloud, Download, Upload, X, CheckCircle2, WalletCards } from 'lucide-react';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Reports from './components/Reports';
import Credits from './components/Credits';
import { Product, Sale } from './types';
import { INITIAL_RATE } from './constants';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'reports' | 'credits'>('inventory');
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Application Data State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('em_products');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('em_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('em_rate');
    return saved ? parseFloat(saved) : INITIAL_RATE;
  });

  // Persistence Effects
  useEffect(() => localStorage.setItem('em_products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('em_sales', JSON.stringify(sales)), [sales]);
  useEffect(() => localStorage.setItem('em_rate', exchangeRate.toString()), [exchangeRate]);

  // Sync Logic
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = () => {
    const dataStr = JSON.stringify({
      products,
      sales,
      exchangeRate,
      version: '1.0',
      date: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_tienda_cute_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);

        // Simple validation
        if (parsedData.products && Array.isArray(parsedData.products)) {
          if (window.confirm("⚠️ Atención: Al restaurar esta copia, se reemplazarán los datos actuales de este dispositivo. ¿Estás seguro?")) {
            setProducts(parsedData.products);
            setSales(parsedData.sales || []);
            setExchangeRate(parsedData.exchangeRate || INITIAL_RATE);
            setShowSyncModal(false);
            alert("¡Datos restaurados con éxito! ✨");
          }
        } else {
          alert("El archivo no es válido.");
        }
      } catch (error) {
        alert("Error al leer el archivo de respaldo.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-primary selection:text-white">
      
      {/* Top Navigation / Header - Cute Theme */}
      <header className="bg-brand-dark text-white shadow-lg shadow-brand-primary/20 sticky top-0 z-50 rounded-b-[2rem]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             {/* Logo Container */}
             <div className="bg-white p-1.5 rounded-2xl shadow-lg shadow-purple-900/20 hover:scale-105 transition-transform cursor-default border-2 border-white/50">
                <img 
                  src="/logo.png" 
                  alt="Logo EM" 
                  className="h-10 w-10 object-contain rounded-xl"
                  onError={(e) => {
                    // Fallback si no encuentran la imagen local
                    (e.target as HTMLImageElement).src = 'https://placehold.co/150x150/FAF5FF/7C3AED?text=EM';
                  }}
                />
             </div>
             <div>
               <h1 className="text-2xl font-black tracking-tight text-white leading-none">EM Tienda</h1>
               <p className="text-[10px] text-purple-200 font-bold uppercase tracking-[0.2em] mt-0.5 hidden sm:block">ONLINE</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 px-5 py-2 rounded-2xl border border-white/20 backdrop-blur-md">
               <span className="hidden md:inline text-xs font-bold text-purple-100 uppercase">Tasa:</span>
               <div className="flex items-center gap-1">
                 <span className="text-sm font-bold text-brand-yellow">Bs.</span>
                 <input 
                    type="number" 
                    value={exchangeRate} 
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-transparent text-white font-extrabold focus:outline-none border-b-2 border-white/30 focus:border-brand-yellow text-center transition-colors"
                 />
               </div>
            </div>

            <button 
              onClick={() => setShowSyncModal(true)}
              className="p-3 bg-brand-primary hover:bg-brand-primaryHover text-white rounded-2xl transition-all shadow-lg shadow-purple-900/20 active:scale-95"
              title="Sincronizar Datos"
            >
              <Cloud size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative border-4 border-white">
            <button 
              onClick={() => setShowSyncModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4 text-brand-primary">
                <Cloud size={32} />
              </div>
              <h3 className="text-2xl font-black text-slate-800">Mis Datos</h3>
              <p className="text-slate-500 font-medium mt-2 text-sm leading-relaxed">
                Tus datos viven en este dispositivo. Para llevarlos a otro celular o PC, descarga una copia y cárgala allá.
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-5 bg-brand-mint/10 hover:bg-brand-mint/20 border border-brand-mint/30 rounded-3xl transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl text-emerald-500 shadow-sm">
                    <Download size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-700 group-hover:text-emerald-700">Guardar Copia</div>
                    <div className="text-xs text-slate-400 font-semibold">Descargar archivo .json</div>
                  </div>
                </div>
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleImportData}
                  className="hidden"
                  id="import-file"
                />
                <label 
                  htmlFor="import-file"
                  className="w-full flex items-center justify-between p-5 bg-brand-bg hover:bg-purple-100 border border-brand-border rounded-3xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-2xl text-brand-primary shadow-sm">
                      <Upload size={24} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-700 group-hover:text-brand-primary">Restaurar Copia</div>
                      <div className="text-xs text-slate-400 font-semibold">Cargar archivo .json</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-slate-100 text-center">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                <CheckCircle2 size={12} /> Seguro y Privado
              </span>
            </div>

          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Cute Navigation Tabs */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-4 md:pb-0">
           <div className="bg-white p-2 rounded-full shadow-lg shadow-purple-100/50 border border-brand-border inline-flex gap-2 min-w-max">
              <NavButton 
                active={activeTab === 'inventory'} 
                onClick={() => setActiveTab('inventory')}
                icon={<Package size={20} />}
                label="Inventario"
              />
              <NavButton 
                active={activeTab === 'sales'} 
                onClick={() => setActiveTab('sales')}
                icon={<ShoppingCart size={20} />}
                label="Ventas"
              />
              <NavButton 
                active={activeTab === 'reports'} 
                onClick={() => setActiveTab('reports')}
                icon={<BarChart3 size={20} />}
                label="Reportes"
              />
              <NavButton 
                active={activeTab === 'credits'} 
                onClick={() => setActiveTab('credits')}
                icon={<WalletCards size={20} />}
                label="Créditos"
              />
           </div>
        </div>

        {/* View Rendering */}
        <div className="min-h-[500px]">
          {activeTab === 'inventory' && (
            <Inventory 
              products={products} 
              setProducts={setProducts} 
              exchangeRate={exchangeRate} 
            />
          )}
          {activeTab === 'sales' && (
            <Sales 
              products={products} 
              setProducts={setProducts} 
              sales={sales} 
              setSales={setSales} 
              exchangeRate={exchangeRate} 
            />
          )}
          {activeTab === 'reports' && (
            <Reports 
              products={products} 
              sales={sales}
              exchangeRate={exchangeRate}
            />
          )}
          {activeTab === 'credits' && (
            <Credits
              sales={sales}
              setSales={setSales}
              exchangeRate={exchangeRate}
            />
          )}
        </div>

      </main>
    </div>
  );
};

// Helper Component for Tabs
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 text-sm font-bold whitespace-nowrap
      ${active 
        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/40 transform scale-105' 
        : 'text-slate-400 hover:bg-purple-50 hover:text-brand-primary'
      }
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;
