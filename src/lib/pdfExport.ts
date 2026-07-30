import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { db, sumSales, sumExpenses, sumProfit } from "./db";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { fmtUGX } from "./i18n";
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type ReportGroupType = "daily" | "weekly" | "monthly" | "raw";

function getGroupKey(ts: number, groupBy: ReportGroupType) {
  if (groupBy === "daily") return format(startOfDay(ts), "MMM dd, yyyy");
  if (groupBy === "weekly") return format(startOfWeek(ts), "'Week of' MMM dd");
  if (groupBy === "monthly") return format(startOfMonth(ts), "MMMM yyyy");
  return format(ts, "PPP p");
}

export async function generateReportPDF(
  startDate: number, 
  endDate: number, 
  groupBy: ReportGroupType = "raw", 
  businessName: string = "Business Report"
) {
  const sales = await db.sales.where("sale_date").between(startDate, endDate, true, true).toArray();
  const expenses = await db.expenses.where("expense_date").between(startDate, endDate, true, true).toArray();
  
  const totalSales = await sumSales(startDate, endDate);
  const totalExp = await sumExpenses(startDate, endDate);
  const totalGrossProfit = await sumProfit(startDate, endDate);
  const profit = totalGrossProfit - totalExp;

  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text(businessName, 14, 20);
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  const periodStr = `Report Period: ${format(startDate, "PP")} - ${format(endDate, "PP")}`;
  doc.text(periodStr, 14, 30);
  doc.text(`Grouping: ${groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}`, 14, 35);
  
  autoTable(doc, {
    startY: 45,
    head: [["Total Sales", "Total Expenses", "Net Profit"]],
    body: [[fmtUGX(totalSales), fmtUGX(totalExp), fmtUGX(profit)]],
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });

  if (groupBy === "raw") {
    let salesBody: string[][] = [];
    for (const s of sales) {
      if (s.status !== "completed") continue;
      const items = await db.sale_items.where("sale_id").equals(s.id!).toArray();
      for (const item of items) {
        salesBody.push([
          format(s.sale_date, "PP p"),
          item.product_name,
          item.quantity.toString(),
          fmtUGX(item.subtotal),
        ]);
      }
    }

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [["Sale Date", "Product", "Qty", "Total"]],
      body: salesBody,
      headStyles: { fillColor: [46, 204, 113] },
    });

    if (expenses.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [["Expense Date", "Reason", "Amount"]],
        body: expenses.map(e => [
          format(e.expense_date, "PP p"),
          e.description ? `${e.category} - ${e.description}` : e.category,
          fmtUGX(e.amount),
        ]),
        headStyles: { fillColor: [231, 76, 60] },
      });
    }
  } else {
    // Aggregated view
    let grouped: Record<string, { s: number; e: number; gp: number; ts: number }> = {};
    
    // Process Sales (calculates sales and gross profit)
    for (const s of sales) {
      if (s.status !== "completed") continue;
      const k = getGroupKey(s.sale_date, groupBy);
      if (!grouped[k]) grouped[k] = { s: 0, e: 0, gp: 0, ts: s.sale_date };
      
      grouped[k].s += s.total_amount;
      
      const items = await db.sale_items.where("sale_id").equals(s.id!).toArray();
      for (const item of items) {
        let cost = (item.cost_price_at_sale ?? 0) * item.quantity;
        if (!item.cost_price_at_sale) {
          const p = await db.products.get(item.product_id);
          cost = (p?.cost_price || 0) * item.quantity;
        }
        grouped[k].gp += (item.subtotal - cost);
      }
    }
    
    // Process Expenses
    for (const e of expenses) {
      const k = getGroupKey(e.expense_date, groupBy);
      if (!grouped[k]) grouped[k] = { s: 0, e: 0, gp: 0, ts: e.expense_date };
      grouped[k].e += e.amount;
    }

    // Sort by timestamp
    const sortedKeys = Object.keys(grouped).sort((a, b) => grouped[a].ts - grouped[b].ts);

    const aggBody = sortedKeys.map(k => {
      const row = grouped[k];
      const net = row.gp - row.e;
      return [
        k,
        fmtUGX(row.s),
        fmtUGX(row.e),
        fmtUGX(net)
      ];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [["Time Period", "Sales", "Expenses", "Net Profit"]],
      body: aggBody,
      theme: "grid",
      headStyles: { fillColor: [39, 174, 96] },
    });
  }

  const fileName = `${businessName.replace(/\s+/g, "_")}_${groupBy}_Report_${format(Date.now(), "yyyyMMdd")}.pdf`;

  if (Capacitor.isNativePlatform()) {
    const base64Str = doc.output('datauristring').split(',')[1];
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Str,
      directory: Directory.Cache
    });
    await Share.share({
      title: 'Sales Report',
      text: 'Here is the generated sales report.',
      url: savedFile.uri,
      dialogTitle: 'Save or Share Report'
    });
  } else {
    doc.save(fileName);
  }
}
