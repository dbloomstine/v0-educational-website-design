// import jsPDF from 'jspdf';
import type { ClassificationResult, ClassificationInput } from './expenseData';
import { fundTypes, fundStages, beneficiaries, expenseCategories } from './expenseData';

export function exportToPDF(input: ClassificationInput, result: ClassificationResult) {
  // PDF export temporarily disabled - install jspdf to enable
  alert('PDF export feature coming soon! Install jspdf package to enable.');
  return;

  /*
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = 20;

  // Helper function to add text with wrapping
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(color[0], color[1], color[2]);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * (fontSize * 0.5) + 5;

    // Check if we need a new page
    if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  // Header
  pdf.setFillColor(14, 165, 233); // primary-500
  pdf.rect(0, 0, pageWidth, 30, 'F');
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Fund Expense Allocation Analysis', margin, 18);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('FundOpsHQ.com', margin, 25);

  yPosition = 45;

  // Date
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  addText(`Generated: ${date}`, 9, false, [100, 100, 100]);
  yPosition += 5;

  // Classification Result
  addText('CLASSIFICATION RESULT', 14, true, [15, 23, 42]);
  yPosition += 2;

  const classificationText = result.classification === 'fund-expense' ? 'FUND EXPENSE' :
                           result.classification === 'management-expense' ? 'MANAGEMENT EXPENSE' :
                           'CASE-BY-CASE';
  const classificationColor = result.classification === 'fund-expense' ? [34, 197, 94] :
                             result.classification === 'management-expense' ? [59, 130, 246] :
                             [234, 179, 8];
  addText(classificationText, 12, true, classificationColor);

  addText(result.headline, 11, true);
  yPosition += 3;

  // Input Details
  addText('EXPENSE DETAILS', 12, true, [15, 23, 42]);

  const categoryName = expenseCategories.find(c => c.id === input.expenseCategory)?.name || 'Custom Expense';
  addText(`Expense Category: ${categoryName}`, 10);

  if (input.customDescription) {
    addText(`Description: ${input.customDescription}`, 10);
  }

  addText(`Fund Type: ${fundTypes[input.fundType].name}`, 10);
  addText(`Fund Stage: ${fundStages[input.fundStage].name}`, 10);
  addText(`Primary Beneficiary: ${beneficiaries[input.primaryBeneficiary].name}`, 10);

  if (input.lpaContext) {
    addText(`LPA Context: ${input.lpaContext}`, 10);
  }
  yPosition += 5;

  // Rationale
  addText('RATIONALE', 12, true, [15, 23, 42]);
  addText(result.rationale, 10);
  yPosition += 3;

  // Detailed Explanation
  addText('DETAILED EXPLANATION', 12, true, [15, 23, 42]);
  addText(result.detailedExplanation, 10);
  yPosition += 3;

  // LP Sensitivities
  addText('LP SENSITIVITIES', 12, true, [15, 23, 42]);
  addText(result.lpSensitivities, 10);
  yPosition += 3;

  // Flags
  if (result.flags.length > 0) {
    addText('IMPORTANT CONSIDERATIONS', 12, true, [234, 88, 12]);
    result.flags.forEach(flag => {
      addText(`• ${flag}`, 9);
    });
    yPosition += 3;
  }

  // Examples
  if (result.examples.length > 0) {
    addText('EXAMPLES', 12, true, [15, 23, 42]);
    result.examples.forEach(example => {
      addText(`• ${example}`, 9);
    });
    yPosition += 3;
  }

  // Sample Language
  if (result.sampleLanguage) {
    addText('SAMPLE LPA LANGUAGE', 12, true, [15, 23, 42]);
    addText(result.sampleLanguage, 9, false, [55, 65, 81]);
    yPosition += 3;
  }

  // Disclaimer
  pdf.setFillColor(243, 244, 246);
  const disclaimerHeight = 35;
  if (yPosition + disclaimerHeight > pdf.internal.pageSize.getHeight() - 20) {
    pdf.addPage();
    yPosition = 20;
  }
  pdf.rect(margin - 5, yPosition - 5, maxWidth + 10, disclaimerHeight, 'F');
  yPosition += 2;
  addText('DISCLAIMER', 10, true, [75, 85, 99]);
  addText('This tool provides educational guidance based on common market practice and is not legal, tax, or accounting advice. Your fund\'s governing documents (LPA, PPM, side letters) and counsel\'s guidance always prevail. Consult with qualified professionals for specific advice on your situation.', 8, false, [75, 85, 99]);

  // Footer
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pdf.internal.pageSize.getHeight() - 10);
    pdf.text('Fund Expense Allocation Helper • FundOpsHQ.com', margin, pdf.internal.pageSize.getHeight() - 10);
  }

  // Save
  const fileName = `fund-expense-analysis-${date.replace(/\s+/g, '-')}.pdf`;
  pdf.save(fileName);
  */
}
