import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

const isUrdu = (text) => {
    if (!text) return false;
    const urduRegex = /[\u0600-\u06FF]/;
    return urduRegex.test(text);
};

export const generateExamPDF = async (paperDetails, questions, schoolInfo) => {
    // Check if the paper contains Urdu text
    const hasUrdu = isUrdu(paperDetails.subject) || questions.some(q => isUrdu(q.QuestionText || q.text));

    if (hasUrdu) {
        return await generateUrduExamPDF(paperDetails, questions, schoolInfo);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // 1. Header - School Name & Logo (Mockup)
    doc.setFontSize(22);
    doc.setTextColor(26, 86, 219); // Primary Blue
    doc.text(schoolInfo?.name || 'Fatima Jinnah School & College Kohat', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`${paperDetails.type} Examination`, pageWidth / 2, 30, { align: 'center' });

    // 2. Paper Metadata
    doc.setDrawColor(200);
    doc.line(15, 35, pageWidth - 15, 35);

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Subject: ${paperDetails.subject}`, 15, 45);
    doc.text(`Class: ${paperDetails.class}`, 15, 52);
    doc.text(`Time: ${paperDetails.duration}`, pageWidth - 15, 45, { align: 'right' });
    doc.text(`Total Marks: ${questions.reduce((sum, q) => sum + (q.marks || 0), 0)}`, pageWidth - 15, 52, { align: 'right' });

    doc.line(15, 57, pageWidth - 15, 57);

    // 3. Instructions
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Instructions: Attempt all questions. Use of calculator is permitted where necessary.', 15, 65);

    // 4. Questions Body
    let currentY = 75;

    const sections = ['MCQ', 'Short', 'Long'];
    const sectionTitles = {
        'MCQ': 'SECTION - A (MULTIPLE CHOICE QUESTIONS)',
        'Short': 'SECTION - B (SHORT QUESTIONS)',
        'Long': 'SECTION - C (LONG QUESTIONS)'
    };

    const sectionInstructions = {
        'MCQ': paperDetails.mcqInstruction || 'Attempt all questions.',
        'Short': paperDetails.shortInstruction || 'Attempt any 5 questions.',
        'Long': paperDetails.longInstruction || 'Attempt any 3 questions.'
    };

    sections.forEach((sectionType, sIdx) => {
        const sectionQuestions = questions.filter(q => q.QuestionType === sectionType || q.type === sectionType);
        if (sectionQuestions.length === 0) return;

        // Start Section on New Page (except the first section)
        if (sIdx > 0) {
            doc.addPage();
            currentY = 30;
        }

        // Section Header
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(sectionTitles[sectionType], 15, currentY);
        currentY += 8;

        // Section Instruction
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text(`Instruction: ${sectionInstructions[sectionType]}`, 15, currentY);
        currentY += 12;

        sectionQuestions.forEach((q, index) => {
            if (currentY > 260) { doc.addPage(); currentY = 20; }

            const qText = q.QuestionText || q.text;
            const qMarks = q.Marks || q.marks;
            const qOptions = q.OptionsJSON ? JSON.parse(q.OptionsJSON) : q.options;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(`${index + 1}.`, 15, currentY);

            doc.setFont('helvetica', 'normal');
            const splitText = doc.splitTextToSize(qText, pageWidth - 45);
            doc.text(splitText, 25, currentY);
            doc.setFont('helvetica', 'italic');
            doc.text(`(${qMarks} Marks)`, pageWidth - 15, currentY, { align: 'right' });
            currentY += (splitText.length * 7) + 2;

            // MCQ Options
            if (sectionType === 'MCQ' && qOptions && Array.isArray(qOptions)) {
                const optLabels = ['(a)', '(b)', '(c)', '(d)'];
                let optX = 25;
                qOptions.forEach((opt, idx) => {
                    doc.text(`${optLabels[idx]} ${opt}`, optX, currentY);
                    optX += (pageWidth - 40) / 2;
                    if (idx === 1) { optX = 25; currentY += 7; }
                });
                currentY += 10;
            } else {
                currentY += 5;
            }
        });
        currentY += 10;
    });

    // 5. Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text('Prepared by: Examination Dept.', 15, doc.internal.pageSize.height - 10);
        doc.text('Approved by: Principal', pageWidth - 15, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    // 6. Save/Download
    doc.save(`${paperDetails.subject}_${paperDetails.class}_Exam.pdf`);
};

const generateUrduExamPDF = async (paperDetails, questions, schoolInfo) => {
    // Create a temporary container for the Urdu Template
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.background = 'white';
    container.style.color = 'black';
    container.style.padding = '40px';
    container.style.direction = 'rtl';
    container.style.fontFamily = "'Tahoma', 'Arial', sans-serif";
    container.style.lineHeight = '1.8';

    // School Header
    const headerHtml = `
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
            <h1 style="margin: 0; font-size: 28px; color: #1a56db;">${schoolInfo?.name || 'Fatima Jinnah School & College Kohat'}</h1>
            <h2 style="margin: 5px 0 0 0; font-size: 20px; color: #444;">${paperDetails.type} Examination</h2>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 16px;">
            <div><strong>مضمون:</strong> ${paperDetails.subject}</div>
            <div><strong>جماعت:</strong> ${paperDetails.class}</div>
            <div><strong>وقت:</strong> ${paperDetails.duration}</div>
        </div>
    `;

    // Sections
    const sections = ['MCQ', 'Short', 'Long'];
    const urduSectionTitles = {
        'MCQ': 'حصہ اول (کثیر الانتخابی سوالات)',
        'Short': 'حصہ دوم (مختصر سوالات)',
        'Long': 'حصہ سوم (تفصیلی سوالات)'
    };
    const urduSectionInstructions = {
        'MCQ': paperDetails.mcqInstruction || 'تمام سوالات حل کریں۔',
        'Short': paperDetails.shortInstruction || 'کوئی سے پانچ سوالات کے جوابات تحریر کریں۔',
        'Long': paperDetails.longInstruction || 'کوئی سے تین سوالات کے جوابات تحریر کریں۔'
    };

    let contentHtml = headerHtml;

    sections.forEach((sectionType) => {
        const sectionQuestions = questions.filter(q => q.QuestionType === sectionType || q.type === sectionType);
        if (sectionQuestions.length === 0) return;

        contentHtml += `
            <div style="margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px;">
                <h3 style="background: #f3f4f6; padding: 5px 10px; display: inline-block;">${urduSectionTitles[sectionType]}</h3>
                <p style="font-style: italic; font-size: 14px; margin-top: 5px;"><strong>ہدایت:</strong> ${urduSectionInstructions[sectionType]}</p>
            </div>
        `;

        sectionQuestions.forEach((q, index) => {
            const qText = q.QuestionText || q.text;
            const qMarks = q.Marks || q.marks;
            const qOptions = q.OptionsJSON ? JSON.parse(q.OptionsJSON) : q.options;

            contentHtml += `
                <div style="margin-bottom: 20px; padding-right: 20px; position: relative;">
                    <span style="position: absolute; right: 0; font-weight: bold;">${index + 1}.</span>
                    <div style="margin-right: 25px;">
                        <span style="font-size: 18px;">${qText}</span>
                        <span style="float: left; font-weight: bold; color: #666;">(${qMarks} نمبر)</span>
                    </div>
                </div>
            `;

            if (sectionType === 'MCQ' && qOptions) {
                contentHtml += `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-right: 25px; margin-top: 10px;">
                        ${qOptions.map((opt, i) => `
                            <div>(${['الف', 'ب', 'ج', 'د'][i]}) ${opt}</div>
                        `).join('')}
                    </div>
                `;
            }
        });
    });

    contentHtml += `
        <div style="margin-top: 50px; border-top: 1px solid #000; padding-top: 100px; display: flex; justify-content: space-between; font-size: 14px;">
            <div>تیار کردہ: شعبہ امتحانات</div>
            <div>دستخط پرنسپل: _________________</div>
        </div>
    `;

    container.innerHTML = contentHtml;
    document.body.appendChild(container);

    // Render to Canvas
    const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${paperDetails.subject}_Urdu_Exam.pdf`);
};
