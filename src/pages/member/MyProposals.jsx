// --- /src/pages/member/MyProposals.jsx ---
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore'; // orderBy 제거
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

const MyProposals = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const scoreLabelMap = { 5: '매우 우수', 4: '우수', 3: '보통', 2: '미흡', 1: '매우 미흡' };

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);

        // ✅ 수정된 부분: orderBy("createdAt", "desc")를 쿼리에서 제거했습니다.
        const q = query(
            collection(db, 'proposals'), 
            where("proposerId", "==", user.uid)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const proposalList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // ✅ 추가된 부분: 데이터를 가져온 후, 브라우저에서 직접 최신순으로 정렬합니다.
            proposalList.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

            setProposals(proposalList);
            setLoading(false);
        }, (error) => {
            console.error("내 안건 로딩 오류: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    const openModal = (proposal) => {
        setSelectedProposal(proposal);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedProposal(null);
    };

    const getStatusBadge = (status) => {
        let statusClass = 'status_badge';
        if (status === 'approved') statusClass += ' status_green';
        else if (status === 'review') statusClass += ' status_blue';
        else if (status === 'rejected') statusClass += ' status_red';
        else statusClass += ' status_yellow';
        
        const statusText = { approved: '채택', review: '재검토', rejected: '미채택', pending: '평가대기' }[status] || status;

        return <span className={statusClass}>{statusText}</span>;
    };

    if (loading) return <Spinner />;
    return ( 
        <div className="page_container">
            <div className="page_header" style={{display: 'block'}}>
                <h2 className="page_title">내 안건 결과 확인</h2>
                <p className="description">제출하신 안건의 평가 상태와 상세 결과를 확인하실 수 있습니다.</p>
            </div>
            <div className="list_container">
                {proposals.length > 0 ? proposals.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => openModal(p)}
                        className="list_item_card list_item_button_card"
                    >
                        <div>
                            <h3 className="list_item_title">{p.title}</h3>
                            <p className="list_item_subtitle">제출일: {p.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                        <div className="list_item_actions">
                            <div style={{textAlign: 'right'}}>
                                {getStatusBadge(p.status)}
                                <p style={{fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem'}}>{p.score != null ? `${p.score}점` : 'N/A'}</p>
                            </div>
                            <div className="list_item_arrow">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        </div>
                    </button>
                )) : <p className="empty_message">제출한 안건이 없습니다.</p>}
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="내 안건 상세 결과" size="4xl">
                {selectedProposal && (
                    <div className="form_layout">
                        <div className="form_group">
                            <label className="section_subtitle">제안 배경</label>
                            <p className="card_light">{selectedProposal.background || '내용 없음'}</p>
                        </div>
                        <div className="form_group">
                            <label className="section_subtitle">주요 내용</label>
                            <p className="card_light">{selectedProposal.content || '내용 없음'}</p>
                        </div>
                        <div className="form_group">
                            <label className="section_subtitle">기대 효과</label>
                            <p className="card_light">{selectedProposal.effects || '내용 없음'}</p>
                        </div>
                        
                        {selectedProposal.evaluationDetails ? (
                            <div className="evaluation_result_container">
                                <h4 className="section_subtitle">관리자 평가 결과</h4>
                                <div className="evaluation_result_list">
                                    {Object.entries(selectedProposal.evaluationDetails).map(([criterion, score]) => (
                                        <div key={criterion} className="evaluation_result_item">
                                            <span>{criterion}</span>
                                            <span className="status_badge status_blue" style={{fontWeight: '500'}}>
                                                {scoreLabelMap[score] || '평가 없음'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="empty_message" style={{borderTop: '1px solid #e2e8f0', marginTop: '1.5rem'}}>
                                아직 관리자 평가가 진행되지 않았습니다.
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default MyProposals;