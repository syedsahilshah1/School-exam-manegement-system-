import React, { useState, useEffect } from 'react';
import { generateDateSheetPDF } from '../Services/DateSheetPDFService';

function DateSheetManagement({ user }) {
    const [dateSheet, setDateSheet] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [bulkEntries, setBulkEntries] = useState([{ classId: '', subjectId: '', examDate: '', examTime: '', roomNo: '', duration: '' }]);
    const [isAdding, setIsAdding] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const isPrincipal = user.Role === 'Principal' || user.Role === 'SuperAdmin';

    useEffect(() => {
        fetchData();
        fetchDateSheet();
    }, []);

    const fetchData = async () => {
        const classesRes = await window.electronAPI.dbQuery("SELECT * FROM Classes");
        const subjectsRes = await window.electronAPI.dbQuery("SELECT * FROM Subjects");
        setClasses(classesRes.data || []);
        setSubjects(subjectsRes.data || []);
    };

    const fetchDateSheet = async () => {
        const res = await window.electronAPI.dbQuery(`
            SELECT ds.*, c.ClassName, sub.SubjectName 
            FROM DateSheet ds
            JOIN Classes c ON ds.ClassId = c.Id
            JOIN Subjects sub ON ds.SubjectId = sub.Id
            ORDER BY ds.ExamDate ASC, ds.ExamTime ASC
        `);
        setDateSheet(res.data || []);
    };

    const handleDownloadPDF = () => {
        const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        // Filter exams for currently selected month
        const currentMonthExams = dateSheet.filter(ds => {
            const dsDate = new Date(ds.ExamDate);
            return dsDate.getMonth() === currentMonth.getMonth() &&
                dsDate.getFullYear() === currentMonth.getFullYear();
        });

        if (currentMonthExams.length === 0) {
            alert("No exams found for " + monthName);
            return;
        }

        generateDateSheetPDF(currentMonthExams, monthName);
    };

    const handleAddRow = () => {
        setBulkEntries([...bulkEntries, { classId: '', subjectId: '', examDate: '', examTime: '', roomNo: '', duration: '' }]);
    };

    const handleRemoveRow = (index) => {
        const updated = bulkEntries.filter((_, i) => i !== index);
        setBulkEntries(updated);
    };

    const handleBulkChange = (index, field, value) => {
        const updated = [...bulkEntries];
        updated[index][field] = value;
        setBulkEntries(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let successCount = 0;
        let errors = [];

        for (const entry of bulkEntries) {
            const { classId, subjectId, examDate, examTime, roomNo, duration } = entry;
            if (!classId || !subjectId || !examDate) continue;

            const query = "INSERT INTO DateSheet (ClassId, SubjectId, ExamDate, ExamTime, RoomNo, Duration) VALUES (?, ?, ?, ?, ?, ?)";
            const res = await window.electronAPI.dbQuery(query, [classId, subjectId, examDate, examTime, roomNo, duration]);

            if (res.success) {
                successCount++;
            } else {
                errors.push(res.error);
            }
        }

        if (successCount > 0) {
            alert(`Success: ${successCount} entries added!`);
            setIsAdding(false);
            setBulkEntries([{ classId: '', subjectId: '', examDate: '', examTime: '', roomNo: '', duration: '' }]);
            fetchDateSheet();
        }
        if (errors.length > 0) {
            alert("Errors occurred in some entries: " + errors.join(", "));
        }
    };

    // Calendar logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentMonth);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const renderCalendar = () => {
        const calendarDays = [];
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<div key={`empty-${i}`} style={{ padding: '0.5rem', background: 'transparent' }}></div>);
        }

        for (let d = 1; d <= days; d++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const examsToday = dateSheet.filter(ds => {
                const dsDate = new Date(ds.ExamDate);
                const dsStr = `${dsDate.getFullYear()}-${String(dsDate.getMonth() + 1).padStart(2, '0')}-${String(dsDate.getDate()).padStart(2, '0')}`;
                return dsStr === dateStr;
            });

            calendarDays.push(
                <div key={d} className="calendar-day" style={{
                    padding: '0.5rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    minHeight: '80px',
                    position: 'relative',
                    borderRadius: '4px'
                }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{d}</span>
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {examsToday.map(ex => (
                            <div key={ex.Id} style={{
                                fontSize: '0.7rem',
                                background: '#3b82f6',
                                padding: '2px 4px',
                                borderRadius: '2px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }} title={`${ex.SubjectName} - ${ex.ClassName}`}>
                                {ex.SubjectName} ({ex.ClassName})
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return calendarDays;
    };

    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2>Date Sheet Management</h2>
                    {isPrincipal && isAdding && (
                        <button
                            onClick={handleAddRow}
                            style={{ padding: '0.4rem 0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            + Add Another Exam
                        </button>
                    )}
                    <button
                        onClick={handleDownloadPDF}
                        style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        📥 Download Monthly PDF
                    </button>
                </div>
                {isPrincipal && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: isAdding ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer'
                        }}
                    >
                        {isAdding ? 'Cancel / View Calendar' : 'Create Date Sheet (Bulk)'}
                    </button>
                )}
            </div>

            {isAdding ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Class</th>
                                    <th style={{ padding: '0.5rem' }}>Subject</th>
                                    <th style={{ padding: '0.5rem' }}>Date</th>
                                    <th style={{ padding: '0.5rem' }}>Time</th>
                                    <th style={{ padding: '0.5rem' }}>Room</th>
                                    <th style={{ padding: '0.5rem' }}>Duration</th>
                                    <th style={{ padding: '0.5rem' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {bulkEntries.map((entry, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.5rem' }}>
                                            <select required value={entry.classId} onChange={(e) => handleBulkChange(index, 'classId', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                <option value="">Class</option>
                                                {classes.map(c => <option key={c.Id} value={c.Id}>{c.ClassName}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <select required value={entry.subjectId} onChange={(e) => handleBulkChange(index, 'subjectId', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                <option value="">Subject</option>
                                                {subjects.map(s => <option key={s.Id} value={s.Id}>{s.SubjectName}</option>)}
                                            </select>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input type="date" required value={entry.examDate} onChange={(e) => handleBulkChange(index, 'examDate', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input type="time" required value={entry.examTime} onChange={(e) => handleBulkChange(index, 'examTime', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input type="text" placeholder="Room" value={entry.roomNo} onChange={(e) => handleBulkChange(index, 'roomNo', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <input type="text" placeholder="e.g. 3h" value={entry.duration} onChange={(e) => handleBulkChange(index, 'duration', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            {bulkEntries.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveRow(index)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="submit" style={{ padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>Save All Entries</button>
                </form>
            ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Prev</button>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Next</button>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {dayNames.map(d => (
                            <div key={d} style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 'bold', fontSize: '0.8rem', opacity: 0.5 }}>{d}</div>
                        ))}
                        {renderCalendar()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DateSheetManagement;
