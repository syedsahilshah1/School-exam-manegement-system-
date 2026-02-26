import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateDateSheetPDF = async (dateSheetData, monthName) => {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    container.style.width = '900px';
    container.style.padding = '40px';
    container.style.backgroundColor = 'white';
    container.style.color = 'black';
    container.style.fontFamily = "'Inter', sans-serif";

    // Sort data by date
    const sortedData = [...dateSheetData].sort((a, b) => new Date(a.ExamDate) - new Date(b.ExamDate));

    container.innerHTML = `
        <div style="border: 2px solid #000; padding: 20px; min-height: 1100px; position: relative;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 26px; text-transform: uppercase;">FATIMA JINNAH SCHOOL AND COLLEGE KOHAT</h1>
                <h2 style="margin: 10px 0; font-size: 20px; color: #333;">EXAMINATION DATE SHEET - ${monthName || ''}</h2>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #000; padding: 12px; text-align: left;">Date</th>
                        <th style="border: 1px solid #000; padding: 12px; text-align: left;">Day</th>
                        <th style="border: 1px solid #000; padding: 12px; text-align: left;">Class</th>
                        <th style="border: 1px solid #000; padding: 12px; text-align: left;">Subject</th>
                        <th style="border: 1px solid #000; padding: 12px; text-align: left;">Time</th>
                        <th style="border: 1px solid #000; padding: 12px; text-align: left;">Room</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedData.map(item => {
        const date = new Date(item.ExamDate);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = date.toLocaleDateString('en-GB');
        return `
                            <tr>
                                <td style="border: 1px solid #000; padding: 10px;">${dateStr}</td>
                                <td style="border: 1px solid #000; padding: 10px;">${dayName}</td>
                                <td style="border: 1px solid #000; padding: 10px;">${item.ClassName}</td>
                                <td style="border: 1px solid #000; padding: 10px;">${item.SubjectName}</td>
                                <td style="border: 1px solid #000; padding: 10px;">${item.ExamTime || '---'}</td>
                                <td style="border: 1px solid #000; padding: 10px;">${item.RoomNo || '---'}</td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>

                </ol>
                <div style="margin-top: 20px; padding: 10px; border: 1px solid #000; background: #fff;">
                    <p style="margin: 0; font-weight: bold; font-size: 16px; text-align: center;">NOTE:</p>
                    <p style="margin: 5px 0 0 0; font-size: 15px; font-weight: bold;">1. Timing for all exams is <u>8:00 AM to 12:00 PM</u>.</p>
                    <p style="margin: 5px 0 0 0; font-size: 15px; font-weight: bold; color: #d32f2f;">2. All school dues MUST be paid before the start of examinations.</p>
                </div>
            </div>

            <div style="position: absolute; bottom: 60px; width: calc(100% - 40px); display: flex; justify-content: space-between;">
                <div style="text-align: center; width: 220px;">
                    <br/>
                    <div style="border-top: 1.5px solid #000; padding-top: 5px; font-weight: bold;">Examination In-charge</div>
                </div>
                <div style="text-align: center; width: 220px;">
                    <br/>
                    <div style="border-top: 1.5px solid #000; padding-top: 5px; font-weight: bold;">Principal Signature</div>
                </div>
            </div>
            
            <div style="position: absolute; bottom: 10px; right: 20px; font-size: 10px; color: #666;">
                Generated on: ${new Date().toLocaleString()}
            </div>
        </div>
    `;

    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`DateSheet_${monthName.replace(' ', '_')}.pdf`);
    } catch (error) {
        console.error("DateSheet PDF Generation Error:", error);
    } finally {
        document.body.removeChild(container);
    }
};
