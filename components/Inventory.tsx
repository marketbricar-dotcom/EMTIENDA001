
import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { SUBCATEGORIES, CATEGORIES_WITH_VARIANTS, generateId } from '../constants';
import { Plus, Edit2, Search, PackageOpen, Trash2, AlertCircle, FileDown, Sparkles, ScanBarcode, LayoutGrid, List } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ScannerModal from './ScannerModal';

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  exchangeRate: number;
}

const Inventory: React.FC<InventoryProps> = ({ products, setProducts, exchangeRate }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGrouped, setIsGrouped] = useState<boolean>(false);
  
  // Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState<'search' | 'form'>('search');

  // Modal State for Deletion
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  // Form State
  const initialFormState: Product = {
    id: '',
    name: '',
    priceUsd: 0,
    stock: 0,
    category: Category.OTROS,
    subcategory: '',
    size: '',
    costPrice: 0,
    profitPercentage: 0,
    barcode: ''
  };
  const [formData, setFormData] = useState<Product>(initialFormState);

  // Computed Products (Filtered)
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchTerm]);

  // Grouping logic
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(product => {
      if (!groups[product.category]) {
        groups[product.category] = [];
      }
      groups[product.category].push(product);
    });
    // Sort group keys alphabetically
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, Product[]>);
  }, [filteredProducts]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setProducts(prev => prev.map(p => p.id === formData.id ? formData : p));
      setIsEditing(false);
    } else {
      const newProduct = { ...formData, id: generateId() };
      setProducts(prev => [...prev, newProduct]);
    }
    setFormData(initialFormState);
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData(initialFormState);
    setIsEditing(false);
  };

  const initiateDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = () => {
    if (!productToDelete) return;
    setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
    if (isEditing && formData.id === productToDelete.id) {
        handleCancel();
    }
    setProductToDelete(null);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as Category;
    setFormData(prev => ({
      ...prev,
      category: newCategory,
      subcategory: '',
      size: ''
    }));
  };

  const handleCostOrProfitChange = (cost: number, profit: number) => {
    let updates: Partial<Product> = { costPrice: cost, profitPercentage: profit };
    if (cost > 0 && profit > 0) {
      const suggestedPrice = cost * (1 + profit / 100);
      updates.priceUsd = parseFloat(suggestedPrice.toFixed(2));
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleScanResult = (result: string) => {
    if (scanMode === 'search') {
      setSearchTerm(result);
    } else {
      setFormData(prev => ({ ...prev, barcode: result }));
    }
    setShowScanner(false);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(124, 58, 237);
    doc.text("Inventario Cute", 14, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Tasa Ref: Bs. ${exchangeRate}`, 14, 34);

    const tableData = products.map(p => [
      p.barcode || '-',
      p.name,
      p.category + (p.subcategory ? ` / ${p.subcategory}` : ''),
      p.size || '-',
      p.stock.toString(),
      `$${p.priceUsd.toFixed(2)}`,
      `Bs. ${(p.priceUsd * exchangeRate).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Código', 'Artículo', 'Categoría', 'Talla', 'Stock', 'Precio ($)', 'Precio (Bs)']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8, font: 'helvetica', cellPadding: 3 },
      headStyles: { fillColor: [192, 132, 252], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      bodyStyles: { textColor: [55, 65, 81] }
    });

    doc.save(`inventario_cute_${new Date().getTime()}.pdf`);
  };

  const showSizeField = CATEGORIES_WITH_VARIANTS.includes(formData.category);
  const subOpts = SUBCATEGORIES[formData.category] || [];

  const renderProductRow = (product: Product) => (
    <tr key={product.id} className="hover:bg-purple-50/50 transition-colors group">
      <td className="px-6 py-5">
        <div className="text-sm font-bold text-slate-700">{product.name}</div>
        <div className="flex gap-2 items-center mt-1">
          {product.size && (
            <span className="inline-block px-2 py-0.5 rounded-md bg-brand-yellow/20 text-yellow-700 text-[10px] font-bold border border-brand-yellow/30">
              {product.size}
            </span>
          )}
          {product.barcode && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 rounded">
              <ScanBarcode size={10} /> {product.barcode}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="text-sm font-medium text-slate-500">{product.category}</div>
        {product.subcategory && <div className="text-xs text-brand-primary/70">{product.subcategory}</div>}
      </td>
      <td className="px-6 py-5 text-right">
        <div className="text-sm font-bold text-slate-800">${product.priceUsd.toFixed(2)}</div>
        <div className="text-[10px] font-semibold text-brand-secondary">Bs. {(product.priceUsd * exchangeRate).toFixed(2)}</div>
      </td>
      <td className="px-6 py-5 text-center">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
          product.stock > 5 
            ? 'bg-brand-mint/10 text-emerald-600 border-brand-mint/30' 
            : 'bg-brand-pink/10 text-pink-600 border-brand-pink/30'
        }`}>
          {product.stock} un
        </span>
      </td>
      <td className="px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-all">
          <button onClick={() => handleEdit(product)} className="p-2 text-brand-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-colors">
            <Edit2 size={18} />
          </button>
          <button onClick={() => initiateDelete(product)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderProductCard = (product: Product) => (
    <div key={product.id} className="bg-white p-5 rounded-[2rem] border border-white shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-slate-800 text-lg">{product.name}</h4>
          <p className="text-xs font-semibold text-brand-secondary">{product.category} {product.subcategory ? `/ ${product.subcategory}` : ''}</p>
        </div>
        <div className="text-right">
          <span className="block font-black text-brand-dark text-lg">${product.priceUsd.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        {product.size && (
          <span className="text-xs font-bold bg-brand-yellow/30 text-yellow-800 px-3 py-1 rounded-lg">
            {product.size}
          </span>
        )}
        {product.barcode && (
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg flex items-center gap-1">
            <ScanBarcode size={12}/> {product.barcode}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-dashed border-purple-100">
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
          product.stock > 0 
            ? 'bg-brand-mint/20 text-emerald-700' 
            : 'bg-brand-pink/20 text-pink-700'
        }`}>
          Stock: {product.stock}
        </span>
        <div className="flex gap-2">
          <button onClick={() => handleEdit(product)} className="p-2 bg-purple-50 text-brand-primary rounded-xl hover:bg-purple-100">
            <Edit2 size={18} />
          </button>
          <button onClick={() => initiateDelete(product)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in relative">
      {showScanner && (
        <ScannerModal onScan={handleScanResult} onClose={() => setShowScanner(false)} />
      )}

      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border-4 border-white">
            <div className="flex flex-col items-center text-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
                 <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">¿Eliminar producto?</h3>
              <p className="text-slate-500 text-sm">
                Estás a punto de borrar <strong>{productToDelete.name}</strong>. ¡No podrás recuperarlo!
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setProductToDelete(null)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors text-sm">Cancelar</button>
              <button onClick={confirmDelete} className="px-6 py-2.5 bg-red-400 hover:bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-200 transition-colors text-sm">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <h2 className="text-3xl font-black text-brand-dark flex items-center gap-3">
            Inventario <Sparkles className="text-brand-yellow" size={24} />
          </h2>
          <p className="text-brand-text/70 font-medium mt-1">Gestiona tus cositas lindas aquí.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-purple-100/50 border border-white sticky top-28">
            <div className="flex items-center gap-2 mb-6">
               <div className={`w-3 h-8 rounded-full ${isEditing ? 'bg-brand-yellow' : 'bg-brand-mint'}`}></div>
               <h3 className="text-lg font-bold text-slate-700">{isEditing ? 'Editar Cosita' : 'Nueva Cosita'}</h3>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Código de Barras</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl bg-brand-bg border-2 border-transparent focus:border-brand-primary/50 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700"
                    placeholder="Escanea o escribe..."
                  />
                  <button type="button" onClick={() => { setScanMode('form'); setShowScanner(true); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-brand-primary rounded-xl transition-all">
                    <ScanBarcode size={18} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-brand-bg border-2 border-transparent focus:border-brand-primary/50 focus:bg-white outline-none transition-all text-sm font-semibold text-slate-700"
                  placeholder="Ej. Blusa de Flores"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 bg-brand-bg/30 p-3 rounded-2xl border border-dashed border-purple-200">
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">Costo $ (Opc)</label>
                   <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPrice || ''}
                    onChange={e => handleCostOrProfitChange(parseFloat(e.target.value) || 0, formData.profitPercentage || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-white outline-none text-sm font-bold text-slate-600"
                  />
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">Ganancia % (Opc)</label>
                   <div className="relative">
                     <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.profitPercentage || ''}
                      onChange={e => handleCostOrProfitChange(formData.costPrice || 0, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-3 pr-6 py-2 rounded-xl bg-white outline-none text-sm font-bold text-slate-600"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs font-bold">%</span>
                   </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Precio ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.priceUsd}
                    onChange={e => setFormData({ ...formData, priceUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-2xl bg-brand-bg outline-none text-sm font-bold text-slate-700"
                  />
                  <div className="mt-2 text-xs font-bold text-brand-mint text-center bg-brand-mint/10 py-1 rounded-lg">
                    Bs. {(formData.priceUsd * exchangeRate).toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 rounded-2xl bg-brand-bg outline-none text-sm font-bold text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Categoría</label>
                <div className="relative">
                    <select
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-3 rounded-2xl bg-brand-bg outline-none text-sm font-semibold text-slate-700 appearance-none cursor-pointer"
                    >
                    {Object.values(Category).sort((a, b) => a.localeCompare(b)).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-primary">▼</div>
                </div>
              </div>
              {subOpts.length > 0 && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Subcategoría</label>
                  <div className="relative">
                      <select
                        value={formData.subcategory}
                        onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-brand-bg outline-none text-sm font-semibold text-slate-700 appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar...</option>
                        {subOpts.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-primary">▼</div>
                   </div>
                </div>
              )}
              {showSizeField && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wide">Variante / Talla</label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={e => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-brand-bg outline-none text-sm font-semibold text-slate-700"
                    placeholder="Ej. Rosado, M"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-brand-primary hover:bg-brand-primaryHover text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg flex justify-center items-center gap-2 text-sm">
                  {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
                  {isEditing ? 'Actualizar' : 'Guardar'}
                </button>
                {isEditing && (
                  <button type="button" onClick={handleCancel} className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors text-sm font-bold">Cancelar</button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-purple-100/50 border border-white overflow-hidden min-h-[600px] flex flex-col">
            <div className="p-6 bg-white border-b border-brand-bg flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2 w-full sm:max-w-md">
                 <div className="relative w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/60 w-5 h-5 group-focus-within:text-brand-primary transition-colors" />
                    <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3 rounded-full bg-brand-bg border-2 border-transparent outline-none text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300"
                    />
                 </div>
                 <button onClick={() => { setScanMode('search'); setShowScanner(true); }} className="p-3 bg-brand-dark/5 hover:bg-brand-primary/10 text-brand-primary rounded-full transition-colors flex-shrink-0" title="Escanear para buscar">
                   <ScanBarcode size={20} />
                 </button>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsGrouped(!isGrouped)}
                  className={`flex-1 sm:flex-none px-4 py-3 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${isGrouped ? 'bg-brand-primary text-white' : 'bg-brand-bg text-brand-primary hover:bg-purple-100'}`}
                  title={isGrouped ? "Ver lista completa" : "Agrupar por categoría"}
                >
                   {isGrouped ? <LayoutGrid size={18} /> : <List size={18} />}
                   <span>{isGrouped ? 'Agrupado' : 'Lista'}</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 sm:flex-none px-6 py-3 bg-brand-yellow/20 hover:bg-brand-yellow/40 text-brand-dark text-sm font-bold rounded-full transition-colors flex items-center justify-center gap-2"
                >
                   <FileDown size={18} />
                   <span>PDF</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1">
              {filteredProducts.length === 0 ? (
                <div className="p-16 text-center text-brand-border h-full flex flex-col items-center justify-center">
                  <PackageOpen size={64} className="mx-auto mb-4 opacity-50 text-brand-primary" />
                  <p className="font-bold text-lg text-brand-secondary">Nada por aquí...</p>
                  <p className="text-sm">¡Agrega tu primer producto!</p>
                </div>
              ) : isGrouped ? (
                // Grouped View
                <div className="p-0">
                  {/* Fixed Type Inference: explicitly cast entries to ensure 'prods' is recognized as Product[] */}
                  {(Object.entries(groupedProducts) as [string, Product[]][]).map(([category, prods]) => (
                    <div key={category} className="mb-2">
                       <div className="bg-brand-bg/50 px-6 py-3 flex items-center justify-between border-y border-purple-50">
                          <h3 className="text-sm font-black text-brand-secondary uppercase tracking-widest">{category}</h3>
                          {/* Fixed: prods.length was showing an error because prods was inferred as unknown */}
                          <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-brand-primary shadow-sm">{prods.length} items</span>
                       </div>
                       
                       {/* Table Group */}
                       <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left">
                            <tbody className="divide-y divide-purple-50">
                               {/* Fixed: prods.map was showing an error because prods was inferred as unknown */}
                               {prods.map(p => renderProductRow(p))}
                            </tbody>
                          </table>
                       </div>

                       {/* Mobile Group */}
                       <div className="md:hidden p-4 space-y-4">
                          {/* Fixed: prods.map was showing an error because prods was inferred as unknown */}
                          {prods.map(p => renderProductCard(p))}
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Classic List View
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-brand-primary/10">
                          <th className="px-6 py-5 text-xs font-extrabold text-brand-primary uppercase tracking-wider">Producto</th>
                          <th className="px-6 py-5 text-xs font-extrabold text-brand-primary uppercase tracking-wider">Categoría</th>
                          <th className="px-6 py-5 text-xs font-extrabold text-brand-primary uppercase tracking-wider text-right">Precio</th>
                          <th className="px-6 py-5 text-xs font-extrabold text-brand-primary uppercase tracking-wider text-center">Stock</th>
                          <th className="px-6 py-5 text-xs font-extrabold text-brand-primary uppercase tracking-wider text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50">
                        {filteredProducts.map(product => renderProductRow(product))}
                      </tbody>
                    </table>
                  </div>
                  <div className="md:hidden p-4 space-y-4 bg-brand-bg/30">
                    {filteredProducts.map(product => renderProductCard(product))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
