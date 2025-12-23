import React, { useState, useMemo } from 'react';
import { Sale, PaymentMethod } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WalletCards, Search, CheckCircle2, FileDown, CalendarClock, User } from 'lucide-react';

interface CreditsProps {
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  exchangeRate: number;
}

const Credits: React.FC<CreditsProps> = ({ sales, setSales, exchangeRate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only unpaid credit sales
  const pendingCredits = useMemo(() => {
    return sales.filter(sale => 
      sale.paymentMethod === PaymentMethod.CREDITO && 
      !sale.isPaid &&
      (sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first
  }, [sales, searchTerm]);

  const totalPendingUsd = useMemo(() => pendingCredits.reduce((acc, curr) => acc + curr.totalUsd, 0), [pendingCredits]);

  const handleMarkAsPaid = (saleId: string, clientName: string) => {
    if (window.confirm(`¿Confirmas que ${clientName} ha pagado su deuda?`)) {
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, isPaid: true } : s));
    }
  };

  const generateCreditsPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(236, 72, 153); // Pink 500
    doc.text("Reporte de Créditos Pendientes", 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Tasa Ref: Bs. ${exchangeRate}`, 14, 34);

    const tableData = pendingCredits.map(sale => [
      sale.clientName || 'Cliente Desconocido',
      new Date(sale.creditDate || sale.date).toLocaleDateString(),
      sale.items.map(i => `${i.quantity} ${i.name}`).join(', '),
      `$${sale.totalUsd.toFixed(2)}`,
      `Bs. ${(sale.totalUsd * sale.exchangeRate).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Cliente', 'Fecha Crédito', 'Artículos', 'Deuda ($)', 'Deuda (Bs)']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [244, 114, 182], textColor: [255, 255, 255], fontStyle: 'bold' }, // Pink 400
      alternateRowStyles: { fillColor: [253, 242, 248] }, // Pink 50
      bodyStyles: { textColor: [55, 65, 81] }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(236, 72, 153);
    doc.text(`Total por Cobrar: $${totalPendingUsd.toFixed(2)}`, 14, finalY + 10);

    doc.save(`creditos_pendientes_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black text-brand-dark flex items-center gap-3">
             Cuentas por Cobrar <WalletCards className="text-brand-pink" size={28} />
           </h2>
           <p className="text-brand-secondary font-medium mt-1">Gestiona los pagos pendientes de tus clientes.</p>
        </div>

        <div className="bg-white p-4 rounded-[2rem] shadow-lg shadow-pink-100 border border-white flex items-center gap-6 min-w-[280px]">
           <div className="p-3 bg-brand-pink/10 rounded-2xl text-pink-500">
              <CalendarClock size={24} />
           </div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Pendiente</p>
              <div className="text-2xl font-black text-brand-dark">${totalPendingUsd.toFixed(2)}</div>
              <div className="text-xs font-bold text-brand-secondary">Bs. {(totalPendingUsd * exchangeRate).toFixed(2)}</div>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-white flex flex-col sm:flex-row gap-4 justify-between items-center sticky top-24 z-10">
         <div className="relative w-full sm:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-pink/40 w-5 h-5 group-focus-within:text-brand-pink transition-colors" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 rounded-2xl bg-brand-bg border-2 border-transparent focus:bg-white focus:border-brand-pink/30 outline-none text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300"
            />
         </div>
         <button
            onClick={generateCreditsPDF}
            disabled={pendingCredits.length === 0}
            className="w-full sm:w-auto px-6 py-3 bg-brand-pink/10 hover:bg-brand-pink/20 text-pink-600 text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <FileDown size={18} />
             <span>Reporte PDF</span>
          </button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingCredits.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center opacity-50">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                <CheckCircle2 size={48} className="text-brand-mint" />
             </div>
             <h3 className="text-xl font-bold text-slate-600">¡Todo al día!</h3>
             <p className="text-slate-400 font-medium">No tienes créditos pendientes por cobrar.</p>
          </div>
        ) : (
          pendingCredits.map(sale => (
            <div key={sale.id} className="bg-white rounded-[2rem] p-6 shadow-xl shadow-purple-50 hover:shadow-purple-100 border border-white transition-all hover:-translate-y-1 group">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-brand-bg rounded-full flex items-center justify-center text-brand-secondary">
                        <User size={20} />
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{sale.clientName || 'Cliente'}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {new Date(sale.creditDate || sale.date).toLocaleDateString()}
                        </p>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className="block font-black text-xl text-brand-dark">${sale.totalUsd.toFixed(2)}</span>
                     <span className="text-xs font-bold text-brand-pink bg-brand-pink/10 px-2 py-1 rounded-lg">Pendiente</span>
                  </div>
               </div>

               <div className="mb-6 bg-brand-bg/50 p-3 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Detalle de compra</p>
                  <ul className="space-y-1">
                     {sale.items.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="text-sm font-semibold text-slate-600 flex justify-between">
                           <span>{item.quantity} x {item.name}</span>
                        </li>
                     ))}
                     {sale.items.length > 3 && (
                        <li className="text-xs text-brand-primary font-bold italic pt-1">
                           + {sale.items.length - 3} artículos más...
                        </li>
                     )}
                  </ul>
               </div>

               <button 
                  onClick={() => handleMarkAsPaid(sale.id, sale.clientName || 'este cliente')}
                  className="w-full py-3 rounded-xl bg-brand-mint text-emerald-800 font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-300 hover:shadow-emerald-200 transition-all flex items-center justify-center gap-2"
               >
                  <CheckCircle2 size={18} />
                  Marcar como Pagado
               </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default Credits;