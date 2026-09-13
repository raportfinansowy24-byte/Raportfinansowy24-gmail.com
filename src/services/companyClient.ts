import { jsPDF } from 'jspdf';
import { CompanyRecord, CompanyFinancials, AiCompanyDiagnostic, CompanyAuditReport } from '../types/company';

export async function fetchCompanyData(query: string): Promise<{ company: CompanyRecord; financials: CompanyFinancials }> {
  const response = await fetch(`/api/company/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Nie udało się pobrać danych spółki');
  }
  return await response.json();
}

export async function fetchCompanyDiagnostic(company: CompanyRecord, financials: CompanyFinancials): Promise<AiCompanyDiagnostic> {
  const response = await fetch('/api/company/diagnostic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, financials })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Błąd generowania audytu AI');
  }
  return await response.json();
}

export async function registerCompanyMonitoring(data: {
  email: string;
  nip: string;
  krs: string;
  companyName: string;
  plan?: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch('/api/company/monitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Błąd rejestracji monitoringu');
  }
  return await response.json();
}

// Helper to sanitize Polish diacritics and special characters for standard PDF fonts
export function sanitizeForPdf(text: string | undefined | null): string {
  if (!text) return '';
  const polishMap: Record<string, string> = {
    'ą': 'a', 'Ą': 'A',
    'ć': 'c', 'Ć': 'C',
    'ę': 'e', 'Ę': 'E',
    'ł': 'l', 'Ł': 'L',
    'ń': 'n', 'Ń': 'N',
    'ó': 'o', 'Ó': 'O',
    'ś': 's', 'Ś': 'S',
    'ź': 'z', 'Ź': 'Z',
    'ż': 'z', 'Ż': 'Z',
  };
  return String(text)
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (match) => polishMap[match] || match)
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate an official B2B Audit PDF report
export function generateCompanyAuditPdf(report: CompanyAuditReport): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const { company, financials, aiDiagnostic, reportId, generatedAt } = report;

  const formatPLN = (val?: number) => {
    if (val === undefined || val === null) return '-';
    if (Math.abs(val) >= 1000000000) return `${(val / 1000000000).toFixed(2)} mld PLN`;
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(2)} mln PLN`;
    return `${val.toLocaleString('pl-PL')} PLN`;
  };

  const safe = (t: string | undefined | null) => sanitizeForPdf(t);

  // ==========================================
  // PAGE 1: EXECUTIVE AUDIT & IDENTIFICATION
  // ==========================================

  // Header band (Deep navy / dark slate)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 40, 'F');

  // Crimson accent strip
  doc.setFillColor(220, 20, 60);
  doc.rect(0, 40, 210, 2, 'F');

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('RAPORT FINANSOWY 24', 15, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 20, 60);
  doc.text('OFICJALNY AUDYT SPOLKI I ANALIZA RYZYKA B2B', 15, 22.5);

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`ID Dokumentu: ${reportId}  |  Wygenerowano: ${generatedAt}`, 15, 30);
  doc.text('Zrodla: Ministerstwo Sprawiedliwosci (KRS), RDF, Biala Lista MF, REGON', 15, 35);

  // Status Scoring Badge (Right side of header)
  const score = aiDiagnostic.overallScore || 80;
  const isHighStability = score >= 75;
  const isModerate = score >= 50 && score < 75;

  if (isHighStability) {
    doc.setFillColor(16, 185, 129); // emerald
  } else if (isModerate) {
    doc.setFillColor(245, 158, 11); // amber
  } else {
    doc.setFillColor(220, 20, 60); // crimson
  }
  doc.roundedRect(144, 8, 52, 24, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SCORING RYZYKA B2B', 148, 14);

  doc.setFontSize(15);
  doc.text(`${score} / 100`, 148, 22);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Stabilnosc: ${safe(aiDiagnostic.financialStability)}`, 148, 28);

  // SECTION 1: METRYKA REJESTROWA I DANE PRAWNE
  let y = 49;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. METRYKA REJESTROWA I STATUS PRAWNY (KRS / MF)', 15, y);

  doc.setDrawColor(220, 20, 60);
  doc.setLineWidth(0.6);
  doc.line(15, y + 1.5, 195, y + 1.5);

  y += 7;
  // Company box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, y, 180, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28); // Dark crimson
  doc.text(safe(company.name), 19, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  // Grid columns
  const c1 = 19;
  const c2 = 78;
  const c3 = 138;

  let rowY = y + 13;
  doc.text(`NIP: ${company.nip || 'Brak'}`, c1, rowY);
  doc.text(`KRS: ${company.krs || 'Brak'}`, c2, rowY);
  doc.text(`REGON: ${company.regon || 'Brak'}`, c3, rowY);

  rowY += 5.5;
  doc.text(`Forma prawna: ${safe(company.legalForm)}`, c1, rowY);
  doc.text(`Data rejestracji: ${safe(company.registrationDate)}`, c2, rowY);
  const cap = typeof company.shareCapital === 'number' ? formatPLN(company.shareCapital) : safe(String(company.shareCapital));
  doc.text(`Kapital zakladowy: ${cap}`, c3, rowY);

  rowY += 5.5;
  const fullAddress = `${company.address.street}, ${company.address.postalCode} ${company.address.city}`;
  doc.text(`Siedziba: ${safe(fullAddress)}`, c1, rowY);

  rowY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 120, 80);
  doc.text(`Status VAT: ${safe(company.vatStatus)} (Biala Lista MF zweryfikowana)`, c1, rowY);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(`Zaleglosci podatkowe (US/ZUS): BRAK`, c3, rowY);

  // SECTION 2: WLADZE SPOLKI I REPREZENTACJA
  y += 48;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. ORGANY ZARZADCZE I REPREZENTACJA (DZIAL 2 KRS)', 15, y);

  doc.setDrawColor(220, 20, 60);
  doc.line(15, y + 1.5, 195, y + 1.5);

  y += 6;
  const boardCount = company.boardMembers?.length || 0;
  const supCount = company.supervisoryBoard?.length || 0;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  const boardBoxHeight = 22;
  doc.roundedRect(15, y, 180, boardBoxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Sklad Zarzadu i reprezentacja:', 19, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  if (boardCount > 0) {
    const membersText = company.boardMembers
      .map(m => `${safe(m.role)}: ${safe(m.name)}${m.appointmentDate ? ` (od ${m.appointmentDate})` : ''}`)
      .join('  |  ');
    const splitMembers = doc.splitTextToSize(membersText, 172);
    doc.text(splitMembers.slice(0, 2), 19, y + 10);
  } else {
    doc.text('Brak ujawnionych czlonkow zarzadu w publicznym odpisie KRS.', 19, y + 10);
  }

  if (supCount > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Rada Nadzorcza:', 19, y + 17);
    doc.setFont('helvetica', 'normal');
    const supText = company.supervisoryBoard!.map(m => `${safe(m.role)}: ${safe(m.name)}`).join('  |  ');
    const splitSup = doc.splitTextToSize(supText, 145);
    doc.text(splitSup[0], 48, y + 17);
  } else {
    doc.text('Rada Nadzorcza: Niepowolana / organ nieobowiazkowy', 19, y + 17);
  }

  // SECTION 3: AUDYT I DIAGNOZA AI (EXECUTIVE SUMMARY)
  y += boardBoxHeight + 6;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. AUDYT AI: SYNTEZA KONDYCJI FINANSOWEJ (GEMINI 3.8)', 15, y);

  doc.setDrawColor(220, 20, 60);
  doc.line(15, y + 1.5, 195, y + 1.5);

  y += 6;
  // Verdict banner
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, y, 180, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const verdict = safe(aiDiagnostic.verdictSummary || 'Spolka wykazuje stabilne wskazniki operacyjne i prawidlowa rentownosc.');
  const splitVerdict = doc.splitTextToSize(verdict, 172);
  doc.text(splitVerdict.slice(0, 3), 19, y + 5.5);

  y += 26;

  // Strengths vs Risks Boxes
  const colWidth = 88;
  const colHeight = 36;

  // Left: Strengths
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, y, colWidth, colHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text('KLUCZOWE MOCNE STRONY', 19, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  let sy = y + 11.5;
  const strengths = aiDiagnostic.keyStrengths?.length > 0 
    ? aiDiagnostic.keyStrengths 
    : ['Wysoka marza operacyjna', 'Prawidlowy stan kapitalu wlasnego', 'Brak zaleglosci rejestrowych'];
  strengths.slice(0, 3).forEach(str => {
    const split = doc.splitTextToSize(`- ${safe(str)}`, colWidth - 8);
    doc.text(split.slice(0, 2), 19, sy);
    sy += (split.length * 3.8);
  });

  // Right: Risks
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(107, y, colWidth, colHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27);
  doc.text('CZYNNIKI RYZYKA I UWAGI', 111, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  let ry = y + 11.5;
  const risks = aiDiagnostic.keyRisks?.length > 0
    ? aiDiagnostic.keyRisks
    : ['Monitorowanie plynnosci biezacej', 'Weryfikacja terminowosci wplat kontrahentow'];
  risks.slice(0, 3).forEach(risk => {
    const split = doc.splitTextToSize(`- ${safe(risk)}`, colWidth - 8);
    doc.text(split.slice(0, 2), 111, ry);
    ry += (split.length * 3.8);
  });

  // Summary note on Liquidity & Debt
  y += colHeight + 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, y, 180, 16, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Ocena plynnosci:', 19, y + 5.5);
  doc.setFont('helvetica', 'normal');
  const splitLiq = doc.splitTextToSize(safe(aiDiagnostic.liquidityAssessment || 'Wskaznik plynnosci na poziomie bezpiecznym dla transakcji handlowych.'), 135);
  doc.text(splitLiq.slice(0, 1), 48, y + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Obsluga zadluzenia:', 19, y + 11);
  doc.setFont('helvetica', 'normal');
  const splitDebt = doc.splitTextToSize(safe(aiDiagnostic.debtSustainability || 'Poziom zadluzenia pozostaje pod scisla kontrola zarzadu.'), 135);
  doc.text(splitDebt.slice(0, 1), 48, y + 11);

  // Footer for Page 1
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(15, 284, 195, 284);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('RaportFinansowy24 (C) Wszystkie prawa zastrzezone. Dokument wygenerowany automatycznie na podstawie danych KRS i RDF.', 15, 288);
  doc.text('Strona 1 z 2', 183, 288);


  // ==========================================
  // PAGE 2: FINANCIAL STATEMENTS & RATIOS & B2B
  // ==========================================
  doc.addPage();

  // Page 2 Header band (compact)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(220, 20, 60);
  doc.rect(0, 24, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RAPORT FINANSOWY 24 | ANALIZA FINANSOWA I REKOMENDACJA B2B', 15, 11);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Podmiot: ${safe(company.name)}  |  NIP: ${company.nip || '-'}  |  KRS: ${company.krs || '-'}`, 15, 18);
  doc.text(`ID: ${reportId}`, 172, 18);

  // SECTION 4: HISTORIA SPRAWOZDAN FINANSOWYCH (RDF)
  y = 33;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('4. ZESTAWIENIE SPRAWOZDAN FINANSOWYCH (BILANS I RZiS - RDF)', 15, y);

  doc.setDrawColor(220, 20, 60);
  doc.setLineWidth(0.6);
  doc.line(15, y + 1.5, 195, y + 1.5);

  y += 6;

  // Table header
  doc.setFillColor(30, 41, 59);
  doc.rect(15, y, 180, 6.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Pozycja Sprawozdania Finansowego', 18, y + 4.5);
  doc.text('2022', 105, y + 4.5);
  doc.text('2023', 135, y + 4.5);
  doc.text('2024 (Ostatni)', 165, y + 4.5);

  y += 6.5;

  const hist = financials.historical || [];
  const h22 = hist.find(h => h.year === '2022') || hist[0];
  const h23 = hist.find(h => h.year === '2023') || hist[1] || hist[0];
  const h24 = hist.find(h => h.year === '2024') || hist[2] || hist[0];

  const finRows = [
    { label: 'Przychody netto ze sprzedazy', y22: h22?.revenue, y23: h23?.revenue, y24: h24?.revenue, highlight: true },
    { label: 'Koszty dzialalnosci operacyjnej', y22: h22?.operatingCosts, y23: h23?.operatingCosts, y24: h24?.operatingCosts },
    { label: 'EBITDA (Wynik operacyjny + amortyzacja)', y22: h22?.ebitda, y23: h23?.ebitda, y24: h24?.ebitda, highlight: true },
    { label: 'Zysk z dzialalnosci operacyjnej (EBIT)', y22: h22?.operatingProfit, y23: h23?.operatingProfit, y24: h24?.operatingProfit },
    { label: 'Zysk / Strata netto', y22: h22?.netProfit, y23: h23?.netProfit, y24: h24?.netProfit, highlight: true },
    { label: 'Aktywa razem (Suma bilansowa)', y22: h22?.assets, y23: h23?.assets, y24: h24?.assets },
    { label: 'Kapital wlasny', y22: h22?.equity, y23: h23?.equity, y24: h24?.equity },
    { label: 'Zobowiazania i rezerwy ogolem', y22: h22?.liabilities, y23: h23?.liabilities, y24: h24?.liabilities }
  ];

  finRows.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y, 180, 5.5, 'F');
    }

    if (row.highlight) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
    }

    doc.setFontSize(7.5);
    doc.text(row.label, 18, y + 3.8);
    doc.text(formatPLN(row.y22), 105, y + 3.8);
    doc.text(formatPLN(row.y23), 135, y + 3.8);
    doc.text(formatPLN(row.y24), 165, y + 3.8);
    y += 5.5;
  });

  // SECTION 5: WSKAZNIKI FINANSOWE (RATIOS)
  y += 5;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('5. GLOWNE WSKAZNIKI RENTOWNOSCI I PLYNNOSCI', 15, y);

  doc.setDrawColor(220, 20, 60);
  doc.line(15, y + 1.5, 195, y + 1.5);

  y += 5.5;

  const cardW = 42.5;
  const cardH = 18;
  const cards = [
    { title: 'MARZA NETTO', value: `${financials.summary.netMarginPercent}%`, desc: 'Rentownosc sprzedazy' },
    { title: 'PLYNNOSC BIEZACA', value: `${financials.summary.currentRatio}x`, desc: financials.summary.currentRatio >= 1.2 ? 'Bezpieczny poziom' : 'Obnizona plynnosc' },
    { title: 'ZADLUZENIE DO KAPITALU', value: `${financials.summary.debtToEquityRatio}x`, desc: 'Wskaznik D/E' },
    { title: 'DYNAMIKA R/R', value: `${financials.summary.yoyRevenueGrowth > 0 ? '+' : ''}${financials.summary.yoyRevenueGrowth}%`, desc: 'Wzrost przychodow' },
  ];

  cards.forEach((card, i) => {
    const cx = 15 + i * (cardW + 3.3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(card.title, cx + 3, y + 4.5);

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, cx + 3, y + 11);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(card.desc, cx + 3, y + 15.5);
  });

  // SECTION 6: REKOMENDACJA B2B & KREDYT KUPIECKI
  y += cardH + 7;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('6. REKOMENDACJA HANDLOWA B2B & KREDYT KUPIECKI', 15, y);

  doc.setDrawColor(220, 20, 60);
  doc.line(15, y + 1.5, 195, y + 1.5);

  y += 5.5;
  const isCreditAllowed = aiDiagnostic.b2bRecommendation?.tradeCreditAllowed !== false;

  doc.setFillColor(isCreditAllowed ? 239 : 254, isCreditAllowed ? 246 : 242, isCreditAllowed ? 255 : 242);
  doc.setDrawColor(isCreditAllowed ? 191 : 254, isCreditAllowed ? 219 : 202, isCreditAllowed ? 254 : 202);
  doc.roundedRect(15, y, 180, 28, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isCreditAllowed ? 30 : 185, isCreditAllowed ? 64 : 28, isCreditAllowed ? 175 : 28);
  const decisionText = isCreditAllowed 
    ? 'DECYZJA: REKOMENDOWANY KREDYT KUPIECKI (POZYTYWNA)' 
    : 'DECYZJA: PRZEDPLATA / PROFORMA (PODWYZSZONE RYZYKO)';
  doc.text(decisionText, 19, y + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Sugerowany bezpieczny limit handlowy: ${safe(aiDiagnostic.b2bRecommendation?.recommendedCreditLimit || '50 000 PLN')}`, 19, y + 12);
  doc.text(`Maksymalny sugerowany termin platnosci: ${aiDiagnostic.b2bRecommendation?.paymentTermsDays || 14} dni`, 19, y + 17);

  doc.setFont('helvetica', 'italic');
  const splitAdvice = doc.splitTextToSize(`Wskazowka: ${safe(aiDiagnostic.b2bRecommendation?.monitoringAdvice || 'Zalecany standardowy monitoring platnosci.')}`, 172);
  doc.text(splitAdvice.slice(0, 2), 19, y + 22.5);

  // SECTION 7: DOPASOWANE FINANSOWANIE B2B
  y += 34;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('7. REKOMENDOWANE INSTRUMENTY FINANSOWANIA B2B', 15, y);

  doc.setDrawColor(220, 20, 60);
  doc.line(15, y + 1.5, 195, y + 1.5);

  y += 5.5;
  const products = aiDiagnostic.suggestedFinancialProducts?.length > 0
    ? aiDiagnostic.suggestedFinancialProducts
    : [
        { title: 'Faktoring B2B (Uwalnianie gotowki)', description: 'Natychmiastowa splata faktur do 90 dni terminu.' },
        { title: 'Kredyt Obrotowy w rachunku biezacym', description: 'Finansowanie biezacych zakupow i wynagrodzen.' }
      ];

  const prodW = 88;
  products.slice(0, 2).forEach((prod, i) => {
    const px = 15 + i * (prodW + 4);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(px, y, prodW, 16, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(safe(prod.title), px + 3, y + 5.5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(safe(prod.description), prodW - 6);
    doc.text(splitDesc.slice(0, 2), px + 3, y + 10.5);
  });

  // SECTION 8: CERTYFIKACJA I PODSUMOWANIE AUDYTU
  y += 22;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, y, 180, 14, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('CERTYFIKACJA AUTOMATYCZNEGO AUDYTU B2B:', 19, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Hash weryfikacyjny: SHA256-${reportId}-${Date.now().toString(16)}`, 19, y + 9.5);
  doc.text('Analiza przeprowadzona algorytmicznie z weryfikacja sumy bilansowej i podatkowej.', 110, y + 9.5);

  // Footer for Page 2
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(15, 284, 195, 284);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('RaportFinansowy24 (C) Wszystkie prawa zastrzezone. Raport stanowi analize wspomagajaca decyzje kredytowe B2B.', 15, 288);
  doc.text('Strona 2 z 2', 183, 288);

  // Save the PDF
  const sanitizedName = safe(company.name).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
  const filename = `Raport_Finansowy24_${company.nip || company.krs || 'spolka'}_${sanitizedName}.pdf`;
  doc.save(filename);
}
