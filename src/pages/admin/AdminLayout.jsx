// --- /src/pages/admin/AdminLayout.jsx ---
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import UserManagement from './UserManagement';
import ProposalEvaluation from './ProposalEvaluation';
import MeetingCreation from './MeetingCreation';
import MeetingResults from './MeetingResults';

const AdminLayout = () => {
    const [activeTab, setActiveTab] = useState('userManagement');

    const renderContent = () => {
        switch (activeTab) {
            case 'userManagement': return <UserManagement />;
            case 'proposalEvaluation': return <ProposalEvaluation />;
            case 'meetingCreation': return <MeetingCreation />;
            case 'meetingResults': return <MeetingResults />;
            default: return <UserManagement />;
        }
    };

    const NavItem = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center px-4 py-3 font-medium rounded-lg transition-colors ${
                activeTab === tab
                ? 'bg-blue-50 text-blue-600 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    const icons = {
        userManagement: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        proposalEvaluation: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-3"><path d="M12 22h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1.35c0 .42.17.83.47 1.13l8.06 8.06c.3.3.47.71.47 1.13V22Z"/><path d="M16 12h2"/></svg>,
        meetingCreation: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-3"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
        meetingResults: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-3"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
                <div className="h-20 flex items-center px-6 border-b border-slate-200">
                    <h1 className="text-xl font-extrabold text-blue-600">관리자 페이지</h1>
                </div>
                <div className="p-4 flex-grow">
                     <div className="mb-6">
                        <p className="text-sm text-slate-500 mb-1">안녕하세요,</p>
                        <p className="font-bold text-lg text-slate-800">관리자님</p>
                    </div>
                    <nav className="space-y-2">
                        <NavItem tab="userManagement" label="로그인 신청 현황" icon={icons.userManagement} />
                        <NavItem tab="proposalEvaluation" label="협의체 안건 평가" icon={icons.proposalEvaluation} />
                        <NavItem tab="meetingCreation" label="회의 개최 관리" icon={icons.meetingCreation} />
                        <NavItem tab="meetingResults" label="회의 결과 작성" icon={icons.meetingResults} />
                    </nav>
                </div>
                <div className="p-4">
                    <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center px-4 py-3 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                        로그아웃
                    </button>
                </div>
            </aside>
            <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;