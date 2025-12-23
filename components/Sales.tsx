
import React, { useState, useMemo } from 'react';
import { Product, CartItem, Sale, PaymentMethod } from '../types';
import { ShoppingCart, Trash2, Search, DollarSign, PackageCheck, History, Sparkles, ScanBarcode } from 'lucide-react';
import ScannerModal from './ScannerModal';
import { generateId } from '../constants';

interface SalesProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  exchangeRate: number;
}

const Sales: React.FC<SalesProps> = ({ products, setProducts, sales, setSales, exchangeRate }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO_USD);
  const [creditInfo, setCreditInfo] = useState({ name: '', date: new Date().toISOString().split('T')[0] });
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  
  // Scanner
  const [showScanner, setShowScanner] = useState(false);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleScanResult = (result: string) => {
    setShowScanner(false);
    // Try to find exact match
    const found = products.find(p => p.barcode === result);
    
    if (found) {
      if (found.stock > 0) {
        addToCart(found);
        // Play success sound logic could go here
        const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
        audio.play().catch(() => {});
      } else {
        alert(`¡${found.name} está agotado!`);
      }
    } else {
      // If not found, just set search term
      setProductSearch(result);
    }
  };

  const totalUsd = useMemo(() => cart.reduce((acc, item) => acc + (item.priceUsd * item.quantity), 0), [cart]);
  const totalBs = useMemo(() => totalUsd * exchangeRate, [totalUsd, exchangeRate]);

  const availableProducts = useMemo(() => {
    return products
      .filter(p => 
        p.stock > 0 && (
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          (p.barcode && p.barcode.includes(productSearch))
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, productSearch]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === PaymentMethod.CREDITO && !creditInfo.name) {
      alert("Ingrese el nombre del cliente para el crédito.");
      return;
    }

    const newSale: Sale = {
      id: generateId(),
      date: new Date().toISOString(),
      items: [...cart],
      totalUsd,
      exchangeRate,
      paymentMethod,
      clientName: paymentMethod === PaymentMethod.CREDITO ? creditInfo.name : undefined,
      creditDate: paymentMethod === PaymentMethod.CREDITO ? creditInfo.date : undefined,
      creditAmount: paymentMethod === PaymentMethod.CREDITO ? totalUsd : undefined,
    };

    setProducts(prevProducts => prevProducts.map(p => {
      const inCart = cart.find(c => c.id === p.id);
      if (inCart) {
        return { ...p, stock: p.stock - inCart.quantity };
      }
      return p;
    }));

    setSales(prev => [newSale, ...prev]);
    setCart([]);
    setPaymentMethod(PaymentMethod.EFECTIVO_USD);
    setCreditInfo({ name: '', date: new Date().toISOString().split('T')[0] });
  };

  const confirmDelete = () => {
    if (!saleToDelete) return;

    setProducts(prevProducts => prevProducts.map(p => {
      const soldItem = saleToDelete.items.find(item => item.id === p.id);
      if (soldItem) {
        return { ...p, stock: p.stock + soldItem.quantity };
      }
      return p;
    }));

    setSales(prevSales => prevSales.filter(s => s.id !== saleToDelete.id));
    setSaleToDelete(null);
  };

  return (
    <div className="animate-fade-in relative h-[calc(100vh-140px)]">
      
      {showScanner && (
        <ScannerModal onScan={handleScanResult} onClose={() => setShowScanner(false)} />
      )}

      {/* Delete Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-6 border-4 border-white">
            <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">¿Anular Venta?</h3>
            <p className="text-slate-500 mb-6 text-sm text-center">
              Los productos volverán al inventario.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setSaleToDelete(null)} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">Cancelar</button>
              <button onClick={confirmDelete} className="px-5 py-2 bg-red-400 hover:bg-red-500 text-white font-bold rounded-2xl shadow-md">Anular</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-4">
        
        {/* Left: Product Selector */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
          
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-100/50 border border-white flex flex-col flex-1 overflow-hidden">
             <div className="p-6 border-b border-purple-50 flex items-center gap-4">
                <div className="bg-brand-bg p-3 rounded-2xl text-brand-primary">
                    <Search className="w-6 h-6" />
                </div>
                <input
                  type="text"
                  placeholder="¿Qué se llevan hoy?"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-xl font-bold text-slate-700 placeholder:text-slate-300"
                />
                <button 
                  onClick={() => setShowScanner(true)}
                  className="bg-brand-dark/5 hover:bg-brand-primary/10 text-brand-primary p-3 rounded-xl transition-colors"
                  title="Escanear"
                >
                  <ScanBarcode size={24} />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 bg-brand-bg/30">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {availableProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white p-4 rounded-3xl border border-transparent hover:border-brand-primary/30 hover:shadow-lg hover:shadow-purple-100 hover:-translate-y-1 transition-all text-left group flex flex-col justify-between h-36 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3">
                         <div className="w-2 h-2 rounded-full bg-brand-mint"></div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-700 text-sm line-clamp-2 group-hover:text-brand-primary transition-colors">{product.name}</div>
                        <div className="text-[10px] font-bold text-brand-secondary uppercase mt-1 tracking-wide">{product.category}</div>
                      </div>
                      
                      {product.size && (
                         <div className="text-xs bg-brand-bg inline-block px-2 py-0.5 rounded-lg text-slate-500 font-bold self-start mt-1 mb-auto">
                            {product.size}
                         </div>
                      )}

                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-50">
                        <span className="font-black text-lg text-brand-dark">${product.priceUsd}</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${product.stock < 5 ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                          {product.stock} un
                        </span>
                      </div>
                    </button>
                  ))}
                  {availableProducts.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-12 text-sm opacity-50">
                        <PackageCheck size={48} className="mb-2"/>
                        <p>No encontramos eso :(</p>
                     </div>
                  )}
                </div>
             </div>
          </div>

          {/* Mini Recent History */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-white h-1/3 flex flex-col overflow-hidden hidden md:flex">
             <div className="px-6 py-4 bg-purple-50/50 border-b border-purple-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                   <History size={18}/> Últimas ventas
                </h3>
             </div>
             <div className="overflow-y-auto p-2">
                {sales.slice(0, 5).map(sale => (
                   <div key={sale.id} className="p-3 mx-2 my-1 rounded-2xl flex justify-between items-center hover:bg-brand-bg group transition-colors">
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${sale.paymentMethod === PaymentMethod.CREDITO ? 'bg-pink-100 text-pink-500' : 'bg-brand-mint/20 text-emerald-600'}`}>
                              $
                          </div>
                          <div>
                              <div className="text-xs font-bold text-slate-700">Venta #{sale.id.slice(0,4)}</div>
                              <div className="text-[10px] font-semibold text-slate-400">{sale.paymentMethod} • {sale.items.length} items</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <span className="font-black text-slate-800 text-sm">${sale.totalUsd.toFixed(2)}</span>
                          <button
                              onClick={() => setSaleToDelete(sale)}
                              className="text-slate-300 hover:text-red-400 transition-colors p-2 hover:bg-red-50 rounded-xl"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] shadow-2xl shadow-brand-primary/10 border-4 border-purple-50 flex flex-col h-full overflow-hidden relative">
             <div className="p-6 bg-brand-dark text-white flex justify-between items-center rounded-t-[2rem]">
                <h2 className="font-black text-xl flex items-center gap-2">
                   <ShoppingCart size={24} className="text-brand-yellow" />
                   Carrito
                </h2>
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full text-white">{cart.length}</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                     <div className="w-20 h-20 bg-brand-bg rounded-full flex items-center justify-center text-brand-primary/30">
                        <Sparkles size={40} />
                     </div>
                     <p className="font-bold text-sm">¡El carrito está vacío!</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-brand-bg/50 rounded-3xl border border-transparent hover:border-brand-primary/20 transition-colors group">
                       <div>
                          <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                          <div className="text-xs font-semibold text-slate-400 mt-1"> 
                            <span className="bg-white px-2 py-0.5 rounded-md shadow-sm text-brand-primary">{item.quantity}</span> x ${item.priceUsd}
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="font-black text-slate-700 text-sm">${(item.quantity * item.priceUsd).toFixed(2)}</div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 flex items-center justify-center bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>

             <div className="p-6 bg-white border-t border-purple-50 rounded-b-[2rem]">
                <div className="mb-4">
                   <label className="block text-xs font-bold text-brand-secondary uppercase mb-2 ml-1">Método de Pago</label>
                   <select 
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full p-3 rounded-2xl border-2 border-brand-bg bg-brand-bg text-sm font-bold text-slate-600 focus:border-brand-primary focus:bg-white outline-none transition-all appearance-none"
                   >
                      {Object.values(PaymentMethod).map(method => (
                         <option key={method} value={method}>{method}</option>
                      ))}
                   </select>
                </div>

                {paymentMethod === PaymentMethod.CREDITO && (
                   <div className="mb-4 p-4 bg-brand-pink/10 rounded-2xl border border-brand-pink/20 text-sm animate-fade-in">
                      <div className="mb-3">
                         <input 
                            type="text" 
                            className="w-full bg-white border border-transparent rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-pink/50 placeholder:text-pink-300 text-pink-700"
                            value={creditInfo.name}
                            onChange={e => setCreditInfo({...creditInfo, name: e.target.value})}
                            placeholder="Nombre del Cliente"
                         />
                      </div>
                      <input 
                        type="date" 
                        className="w-full bg-white border border-transparent rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-pink/50 text-pink-700"
                        value={creditInfo.date}
                        onChange={e => setCreditInfo({...creditInfo, date: e.target.value})}
                      />
                   </div>
                )}

                <div className="space-y-2 mb-6 bg-brand-bg/50 p-4 rounded-2xl">
                   <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm font-bold">Total USD</span>
                      <span className="font-black text-2xl text-brand-dark">${totalUsd.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-brand-secondary font-semibold">En Bolívares</span>
                      <span className="font-bold text-slate-600 bg-white px-2 py-1 rounded-lg shadow-sm">Bs. {totalBs.toFixed(2)}</span>
                   </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-4 rounded-2xl font-black text-white transition-all shadow-lg flex justify-center items-center gap-2 text-sm transform active:scale-95
                    ${cart.length === 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-brand-primary hover:bg-brand-primaryHover shadow-brand-primary/30'}
                  `}
                >
                   <DollarSign size={20} />
                   COBRAR
                </button>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Sales;
