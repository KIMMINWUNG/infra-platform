// --- /src/pages/member/MemberLayout.jsx ---
import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import ProposalSubmit from './ProposalSubmit';
import MyProposals from './MyProposals';
import MeetingList from './MeetingList';
import MeetingResultsView from './MeetingResultsView';

const MemberLayout = () => {
    const [activeTab, setActiveTab] = useState('proposalSubmit');
    const { userData } = useAuth();
    
    const renderContent = () => {
        switch (activeTab) {
            case 'proposalSubmit': return <ProposalSubmit />;
            case 'myProposals': return <MyProposals />;
            case 'meetingList': return <MeetingList />;
            case 'meetingResultsView': return <MeetingResultsView />;
            default: return <ProposalSubmit />;
        }
    };

    const NavItem = ({ tab, label, icon }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`navItem ${activeTab === tab ? 'active' : ''}`}
        >
            <span className="navItem_icon">{icon}</span>
            {label}
        </button>
    );

    const icons = {
        proposalSubmit: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>,
        myProposals: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>,
        meetingList: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>,
        meetingResultsView: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/></svg>,
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar_header">
                    <h1 className="logo">의원 페이지</h1>
                </div>
                <div className="sidebar_content">
                     <div className="userInfo">
                        <p>환영합니다,</p>
                        <p className="userName">{userData?.name} 님</p>
                        <p style={{fontSize: '0.875rem'}}>{userData?.affiliation}</p>
                    </div>
                    <nav className="nav">
                        <NavItem tab="proposalSubmit" label="협의체 안건 제안" icon={icons.proposalSubmit} />
                        <NavItem tab="myProposals" label="내 안건 결과 확인" icon={icons.myProposals} />
                        <NavItem tab="meetingList" label="회의 참석 신청" icon={icons.meetingList} />
                        <NavItem tab="meetingResultsView" label="협의체 회의 결과" icon={icons.meetingResultsView} />
                    </nav>
                </div>
                <div className="sidebar_footer">
                    <button onClick={() => signOut(auth)} className="logoutButton">
                        <span className="navItem_icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg></span>
                        로그아웃
                    </button>
                </div>
            </aside>
            <main className="main_content">
                 <div className="main_container">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default MemberLayout;