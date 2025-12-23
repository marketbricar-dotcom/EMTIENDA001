
import React from 'react';
import { Product, Sale } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, ClipboardList, TrendingUp, Download, Star } from 'lucide-react';

interface ReportsProps {
  products: Product[];
  sales: Sale[];
  exchangeRate: number;
}

const Reports: React.FC<ReportsProps> = ({ products, sales, exchangeRate }) => {

  const generateSalesPDF = (period: 'daily' | 'monthly') => {
    const doc = new jsPDF();
    const now = new Date();
    
    let filteredSales = sales;
    let title = "";

    if (period === 'daily') {
      const todayStr = now.toISOString().split('T')[0];
      filteredSales = sales.filter(s => s.date.startsWith(todayStr));
      title = `Reporte del Día (${todayStr})`;
    } else {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filteredSales = sales.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      title = `Reporte del Mes (${currentMonth + 1}/${currentYear})`;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(124, 58, 237); // Violet 600
    doc.text("EM Tienda - Reporte Financiero", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    doc.text(title, 14, 28);

    const tableData = filteredSales.map(sale => [
      new Date(sale.date).toLocaleDateString() + ' ' + new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      sale.items.map(i => `${i.quantity} ${i.name}`).join(', '),
      sale.paymentMethod,
      `$${sale.totalUsd.toFixed(2)}`,
      `Bs. ${(sale.totalUsd * sale.exchangeRate).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Detalle', 'Método', 'Total $', 'Total Bs']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [192, 132, 252], textColor: [255, 255, 255], fontStyle: 'bold' }, // Purple 400
      alternateRowStyles: { fillColor: [250, 245, 255] }, // Purple 50
    });

    const totalPeriodUsd = filteredSales.reduce((acc, curr) => acc + curr.totalUsd, 0);
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    
    doc.setFillColor(243, 232, 255); // Purple 100
    doc.rect(14, finalY + 5, 180, 15, 'F');
    doc.setFontSize(12);
    doc.setTextColor(124, 58, 237);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Periodo: $${totalPeriodUsd.toFixed(2)}`, 20, finalY + 14);

    doc.save(`reporte_${period}_cute.pdf`);
  };

  const generateInventoryPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(124, 58, 237);
    doc.text("Inventario Valorizado", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 26);

    const tableData = products.map(p => [
      p.name,
      p.category,
      p.stock.toString(),
      `$${p.priceUsd.toFixed(2)}`,
      `$${(p.priceUsd * p.stock).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [['Producto', 'Categoría', 'Stock', 'Unitario', 'Total Valor']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' }, // Violet 600
      alternateRowStyles: { fillColor: [243, 244, 246] },
    });
    
    const totalVal = products.reduce((acc, p) => acc + (p.priceUsd * p.stock), 0);
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(124, 58, 237);
    doc.text(`Valor Total Inventario: $${totalVal.toFixed(2)}`, 14, finalY + 10);

    doc.save(`inventario_full_cute.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      
      <div className="text-center pb-6">
        <h2 className="text-3xl font-black text-brand-dark mb-2">Centro de Reportes</h2>
        <p className="text-brand-secondary font-medium">Descarga tus estadísticas en PDF.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Sales Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-purple-100/50 border border-white group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex flex-col items-center text-center mb-6">
             <div className="w-16 h-16 bg-brand-yellow/20 text-yellow-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <TrendingUp size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-800">Ventas</h3>
             <p className="text-sm text-slate-400 font-semibold mt-1">¿Cuánto hemos vendido hoy?</p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => generateSalesPDF('daily')}
              className="w-full py-3 px-4 bg-brand-bg hover:bg-brand-primary/10 text-brand-primary text-sm font-bold rounded-2xl border-2 border-transparent hover:border-brand-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <Star size={16} className="text-brand-yellow fill-brand-yellow" />
              Reporte del Día
            </button>
            <button 
              onClick={() => generateSalesPDF('monthly')}
              className="w-full py-3 px-4 bg-brand-dark text-white text-sm font-bold rounded-2xl hover:bg-brand-dark/90 shadow-lg shadow-brand-dark/20 transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Reporte del Mes
            </button>
          </div>
        </div>

        {/* Inventory Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-purple-100/50 border border-white group hover:-translate-y-1 transition-transform duration-300">
          <div className="flex flex-col items-center text-center mb-6">
             <div className="w-16 h-16 bg-brand-mint/20 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <ClipboardList size={32} />
             </div>
             <h3 className="text-xl font-bold text-slate-800">Existencias</h3>
             <p className="text-sm text-slate-400 font-semibold mt-1">Listado completo valorizado.</p>
          </div>
          
          <div className="mt-auto">
            <button 
                onClick={generateInventoryPDF}
                className="w-full py-4 px-4 bg-brand-primary text-white text-sm font-bold rounded-2xl hover:bg-brand-primaryHover shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-3 transition-all"
            >
                <FileText size={20} />
                Descargar Inventario
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
