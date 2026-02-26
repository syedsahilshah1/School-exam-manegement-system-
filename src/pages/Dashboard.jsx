import React, { useState, useEffect } from 'react';
import QuestionForm from '../components/QuestionForm';
import TeacherManagement from '../components/TeacherManagement';
import PaperManagement from '../components/PaperManagement';
import SyllabusManagement from '../components/SyllabusManagement';
import DateSheetManagement from '../components/DateSheetManagement';

function Dashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('Overview');
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

    useEffect(() => {
        if (activeTab === 'Overview') {
            fetchStats();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        let totalQ = "SELECT COUNT(*) as count FROM Papers";
        let pendingQ = "SELECT COUNT(*) as count FROM Papers WHERE Status = 'Submitted'";
        let approvedQ = "SELECT COUNT(*) as count FROM Papers WHERE Status = 'Approved'";

        if (user.Role !== 'SuperAdmin') {
            totalQ += ` WHERE TeacherId = ${user.Id}`;
            pendingQ += ` AND TeacherId = ${user.Id}`;
            approvedQ += ` AND TeacherId = ${user.Id}`;
        }

        const totalRes = await window.electronAPI.dbQuery(totalQ);
        const pendingRes = await window.electronAPI.dbQuery(pendingQ);
        const approvedRes = await window.electronAPI.dbQuery(approvedQ);

        setStats({
            total: totalRes.data?.[0]?.count || 0,
            pending: pendingRes.data?.[0]?.count || 0,
            approved: approvedRes.data?.[0]?.count || 0,
        });
    };

    return (
        <div style={{ display: 'flex', flexFlow: 'column', height: '100vh' }}>
            <header style={{
                padding: '1rem 2rem',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <h1>{user.Role === 'SuperAdmin' ? 'Admin Panel' : 'Teacher Panel'}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span>Welcome, {user.Name}</span>
                    <button onClick={onLogout} style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer' }}>Logout</button>
                </div>
            </header>

            <main style={{ flex: 1, padding: '2rem', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', overflow: 'hidden' }}>
                <aside className="glass-card" style={{ padding: '1rem' }}>
                    <ul style={{ listStyle: 'none' }}>
                        <li
                            onClick={() => setActiveTab('Overview')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: activeTab === 'Overview' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                            }}>
                            Dashboard
                        </li>
                        <li
                            onClick={() => setActiveTab('Create')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: activeTab === 'Create' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                            }}>
                            {user.Role === 'SuperAdmin' ? 'Manage Teachers' : 'Create Paper'}
                        </li>
                        <li
                            onClick={() => setActiveTab('Papers')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: activeTab === 'Papers' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                            }}>
                            {user.Role === 'SuperAdmin' ? 'Approve Papers' : 'My Papers'}
                        </li>
                        <li
                            onClick={() => setActiveTab('Settings')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: activeTab === 'Settings' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                                position: 'relative',
                                zIndex: 10
                            }}>
                            Settings
                        </li>
                        <li
                            onClick={() => setActiveTab('Syllabus')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: activeTab === 'Syllabus' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                            }}>
                            Syllabus
                        </li>
                        <li
                            onClick={() => setActiveTab('DateSheet')}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                background: activeTab === 'DateSheet' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '0.5rem',
                                cursor: 'pointer',
                            }}>
                            Date Sheet
                        </li>
                    </ul>
                </aside>

                <section style={{ overflowY: 'auto', paddingRight: '1rem', position: 'relative', zIndex: 5 }}>
                    {activeTab === 'Overview' && (
                        <div className="glass-card">
                            <h2>Overview</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: '#9ca3af' }}>{user.Role === 'SuperAdmin' ? 'Total Papers Created' : 'My Total Papers'}</p>
                                    <h3 style={{ fontSize: '2rem' }}>{stats.total}</h3>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: '#9ca3af' }}>Pending Approval</p>
                                    <h3 style={{ fontSize: '2rem', color: '#f59e0b' }}>{stats.pending}</h3>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: '#9ca3af' }}>Approved</p>
                                    <h3 style={{ fontSize: '2rem', color: '#10b981' }}>{stats.approved}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Create' && (
                        user.Role === 'SuperAdmin' ? (
                            <TeacherManagement />
                        ) : (
                            <QuestionForm user={user} onBack={() => setActiveTab('Overview')} />
                        )
                    )}

                    {activeTab === 'Papers' && (
                        <PaperManagement user={user} />
                    )}

                    {activeTab === 'Settings' && (
                        <div className="glass-card">
                            <h2>Database Settings</h2>
                            <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Manage your school structure and basic configurations.</p>

                            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ color: '#fbbf24', fontSize: '1.1rem' }}>School Classes Maintenance</h3>
                                <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0.5rem 0 1rem 0' }}>
                                    This will update the school classes to: Play Group up to Class 8.
                                    (Higher classes like 9th-12th will be removed).
                                </p>
                                <button
                                    onClick={async () => {
                                        if (!window.confirm("Are you sure? This will remove records for classes higher than 8th grade.")) return;

                                        try {
                                            // 1. Classes Update (Play Group to 8th)
                                            const higherClassesRes = await window.electronAPI.dbQuery("SELECT Id FROM Classes WHERE ClassName IN ('9th', '10th', '11th', '12th', 'BS', 'Inter')");
                                            const higherIds = higherClassesRes.data?.map(c => c.Id) || [];
                                            if (higherIds.length > 0) {
                                                const idList = higherIds.join(',');
                                                await window.electronAPI.dbQuery(`DELETE FROM Syllabus WHERE ClassId IN (${idList})`);
                                                await window.electronAPI.dbQuery(`DELETE FROM DateSheet WHERE ClassId IN (${idList})`);
                                                await window.electronAPI.dbQuery(`DELETE FROM Classes WHERE Id IN (${idList})`);
                                            }

                                            // Add Play Group
                                            const checkPG = await window.electronAPI.dbQuery("SELECT * FROM Classes WHERE ClassName = 'Play Group'");
                                            if (checkPG.data?.length === 0) await window.electronAPI.dbQuery("INSERT INTO Classes (ClassName) VALUES ('Play Group')");

                                            // 2. Subjects Update
                                            const schoolSubjects = ['English', 'Urdu', 'Maths', 'Drawing', 'Nazra', 'G.Knowledge', 'Islamiat', 'S.Study', 'Science', 'Chemistry', 'Physics', 'Biology', 'MQ/Nazra'];
                                            for (const subName of schoolSubjects) {
                                                const checkSub = await window.electronAPI.dbQuery("SELECT * FROM Subjects WHERE SubjectName = ?", [subName]);
                                                if (checkSub.data?.length === 0) {
                                                    await window.electronAPI.dbQuery("INSERT INTO Subjects (SubjectName) VALUES (?)", [subName]);
                                                }
                                            }

                                            alert("Success! Classes (Play Group-8th) and Subjects updated successfully.");
                                        } catch (err) {
                                            alert("Error during maintenance: " + err.message);
                                        }
                                    }}
                                    style={{ padding: '0.6rem 1.2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Fix School Structure (Classes & Subjects)
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Syllabus' && (
                        <SyllabusManagement user={user} />
                    )}

                    {activeTab === 'DateSheet' && (
                        <DateSheetManagement user={user} />
                    )}
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
