import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateCombinedSyllabusPDF = async (syllabusList, footerNote = "") => {
    if (!syllabusList || syllabusList.length === 0) return;

    const { ClassName, Term } = syllabusList[0];

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    container.style.width = '800px';
    container.style.padding = '50px';
    container.style.backgroundColor = 'white';
    container.style.color = 'black';
    container.style.fontFamily = "'Inter', 'Noto Sans Urdu', sans-serif";

    let sectionsHTML = '';
    syllabusList.forEach((s, index) => {
        const isUrdu = s.SubjectName.toLowerCase().includes('urdu') ||
            s.SubjectName.toLowerCase().includes('islamiat') ||
            s.SubjectName.toLowerCase().includes('nazra');

        sectionsHTML += `
            <div style="margin-top: 25px; page-break-inside: avoid;">
                <div style="border-bottom: 2px solid #334155; margin-bottom: 10px; display: flex; align-items: baseline; gap: 10px;">
                    <h3 style="margin: 0; font-size: 20px; color: #0f172a; font-weight: 800; text-decoration: underline;">${s.SubjectName}:</h3>
                </div>
                <div style="padding: 5px 0; line-height: 1.8; white-space: pre-wrap; font-size: 16px; direction: ${isUrdu ? 'rtl' : 'ltr'}; text-align: ${isUrdu ? 'right' : 'left'}; color: #1e293b; font-weight: 500;">
                    ${s.SyllabusContent}
                </div>
            </div>
        `;
    });

    container.innerHTML = `
        <div style="border: 3px double #000; padding: 30px; min-height: 1050px; position: relative; background: #fff;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #000;">FATIMA JINNAH SCHOOL AND COLLEGE KOHAT</h1>
                <h2 style="margin: 10px 0; font-size: 22px; color: #334155;">“Syllabus for ${Term || 'Final Exam'}”</h2>
                <h3 style="margin: 5px 0; font-size: 20px; font-weight: 600;">Class: ${ClassName}</h3>
            </div>
            
            <div style="margin-bottom: 40px;">
                ${sectionsHTML}
            </div>

            ${footerNote ? `
            <div style="margin-top: 40px; padding: 15px; border: 1px dashed #64748b; background: #f8fafc; border-radius: 4px;">
                <strong style="color: #0f172a;">Note:</strong>
                <p style="margin: 5px 0 0 0; color: #334155; font-size: 14px; font-style: italic;">${footerNote}</p>
            </div>
            ` : ''}

            <div style="position: absolute; bottom: 40px; width: calc(100% - 60px); display: flex; justify-content: space-between; padding: 0 30px;">
                <div style="border-top: 1.5px solid #000; width: 220px; text-align: center; padding-top: 8px; font-weight: 700; font-size: 14px;">Examination Incharge</div>
                <div style="border-top: 1.5px solid #000; width: 220px; text-align: center; padding-top: 8px; font-weight: 700; font-size: 14px;">Principal's Approval</div>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`Syllabus_${ClassName}_${Term || 'Exam'}.pdf`);
    } catch (error) {
        console.error("Combined PDF Generation Error:", error);
    } finally {
        document.body.removeChild(container);
    }
};

export const generateSyllabusPDF = async (syllabus, footerNote = "") => {
    const { ClassName, SubjectName, SyllabusContent, content, TeacherName, CreatedDate, Term } = syllabus;
    const finalContent = SyllabusContent || content;

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    container.style.width = '794px';
    container.style.padding = '40px';
    container.style.backgroundColor = 'white';
    container.style.color = 'black';
    container.style.fontFamily = "'Arial', sans-serif";

    const isUrdu = SubjectName?.toLowerCase().includes('urdu') || SubjectName?.toLowerCase().includes('islamiat') || SubjectName?.toLowerCase().includes('nazra') || /[\u0600-\u06FF]/.test(finalContent);

    container.innerHTML = `
        <div style="border: 2px solid #000; padding: 30px; min-height: 1040px; position: relative; background: #fff;">
            <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: bold; color: #000; text-transform: uppercase;">FATIMA JINNAH SCHOOL AND COLLEGE KOHAT</h1>
                <p style="margin: 5px 0; font-size: 18px; color: #000; font-weight: bold;">“Syllabus for ${Term || 'Final Exam'}”</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1.5px solid #000; padding-bottom: 8px;">
                <div style="font-size: 16px; font-weight: bold;">Class: ${ClassName}</div>
                ${SubjectName ? `<div style="font-size: 16px; font-weight: bold;">Subject: ${SubjectName}</div>` : '<div style="font-size: 16px; font-weight: bold;">Full Class Syllabus</div>'}
                <div style="font-size: 14px;">Date: ${new Date(CreatedDate).toLocaleDateString()}</div>
            </div>

            <div style="margin-bottom: 15px; font-weight: bold; font-size: 14px;">
                Teacher: ${TeacherName || 'N/A'}
            </div>

            <div style="margin-top: 10px; min-height: 700px;">
                <div style="line-height: 1.6; white-space: pre-wrap; font-size: 15px; direction: ${isUrdu ? 'rtl' : 'ltr'}; text-align: ${isUrdu ? 'right' : 'left'}; color: #000;">
                    ${finalContent}
                </div>
            </div>

            ${footerNote ? `
            <div style="margin-top: 40px; padding: 15px; border: 1px dashed #64748b; background: #f8fafc; border-radius: 4px;">
                <strong style="color: #0f172a;">Note:</strong>
                <p style="margin: 5px 0 0 0; color: #334155; font-size: 14px; font-style: italic;">${footerNote}</p>
            </div>
            ` : ''}

            <div style="margin-top: 60px; width: 100%; display: flex; justify-content: space-between; padding: 0 10px;">
                <div style="border-top: 1.5px solid #000; width: 220px; text-align: center; padding-top: 8px; font-weight: 700; font-size: 14px;">Incharge Signature</div>
                <div style="border-top: 1.5px solid #000; width: 220px; text-align: center; padding-top: 8px; font-weight: 700; font-size: 14px;">Principal's Approval</div>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Handle multi-page
        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }

        const fileName = SubjectName ? `${SubjectName}_${ClassName}_Syllabus.pdf` : `${ClassName}_Combined_Syllabus.pdf`;
        pdf.save(fileName);
    } catch (error) {
        console.error("PDF Generation Error:", error);
    } finally {
        document.body.removeChild(container);
    }
};

export const exportSyllabusToWord = (syllabusList, title = "Syllabus") => {
    // Helper to format content for Word (handling line breaks and escaping)
    const formatContent = (text) => {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .split('\n')
            .map(line => line.trim() ? `<p style="margin: 0; padding: 2pt 0; line-height: 1.5;">${line}</p>` : '<p style="margin: 0; padding: 5pt 0;">&nbsp;</p>')
            .join('');
    };

    let content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${title}</title>
        <style>
            body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; }
            .header-info { text-align: center; border-bottom: 2pt solid #000; padding-bottom: 10pt; margin-bottom: 20pt; }
            .school-name { font-size: 24pt; font-weight: bold; margin: 0; text-transform: uppercase; }
            .exam-title { font-size: 18pt; font-weight: bold; margin: 5pt 0; text-decoration: underline; }
            .section-block { margin-top: 20pt; page-break-inside: avoid; }
            .subject-title { font-size: 16pt; font-weight: bold; text-decoration: underline; margin-bottom: 10pt; display: block; }
            .text-content { font-size: 12pt; margin-top: 10pt; text-align: left; }
            .urdu { direction: rtl; text-align: right; font-family: 'Simplified Arabic', 'Noto Sans Urdu', serif; font-size: 15pt; line-height: 2; }
            .meta-data { font-size: 10pt; color: #555; font-style: italic; margin-top: 10pt; border-top: 1pt solid #eee; padding-top: 5pt; }
            .signature-area { margin-top: 60pt; }
        </style>
        </head>
        <body>
            <div class="header-info">
                <p class="school-name">FATIMA JINNAH SCHOOL AND COLLEGE KOHAT</p>
                <p class="exam-title">“${title}”</p>
            </div>
    `;

    syllabusList.forEach(s => {
        const isUrdu = s.SubjectName.toLowerCase().includes('urdu') || s.SubjectName.toLowerCase().includes('islamiat') || s.SubjectName.toLowerCase().includes('nazra');
        content += `
            <div class="section-block">
                <div class="subject-title">SUBJECT: ${s.SubjectName.toUpperCase()} (CLASS: ${s.ClassName})</div>
                <div class="text-content ${isUrdu ? 'urdu' : ''}">
                    ${formatContent(s.SyllabusContent)}
                </div>
                <div class="meta-data">Teacher: ${s.TeacherName || 'N/A'}</div>
            </div>
        `;
    });

    content += `
            <div class="signature-area">
                <table width="100%" style="margin-top: 40pt;">
                    <tr>
                        <td width="50%" align="left" style="border-top: 1pt solid #000; padding-top: 5pt;"><b>Examination Incharge Signature</b></td>
                        <td width="50%" align="right" style="border-top: 1pt solid #000; padding-top: 5pt;"><b>Principal's Approval</b></td>
                    </tr>
                </table>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', content], {
        type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/ /g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
