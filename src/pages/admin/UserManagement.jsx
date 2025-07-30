// --- /src/pages/admin/UserManagement.jsx ---
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';

const UserManagement = () => {
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null, action: null });
    const [activeFilter, setActiveFilter] = useState('전체');
    const divisions = ['전체', '교통', '유통공급', '방재', '환경기초', '미승인'];

    useEffect(() => {
        setLoading(true);
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            userList.sort((a, b) => {
                if (a.approved !== b.approved) { return a.approved ? 1 : -1; }
                return (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0);
            });

            setAllUsers(userList);
            setLoading(false);
        }, (error) => {
            console.error("사용자 정보 수신 에러: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (activeFilter === '전체') {
            setFilteredUsers(allUsers);
        } else if (activeFilter === '미승인') {
            setFilteredUsers(allUsers.filter(user => !user.approved));
        } else {
            setFilteredUsers(allUsers.filter(user => user.division === activeFilter && user.approved));
        }
    }, [activeFilter, allUsers]);


    const openConfirmModal = (user, action) => {
        setConfirmModal({ isOpen: true, user, action });
    };

    const handleConfirmAction = async () => {
        const { user, action } = confirmModal;
        if (!user || !action) return;

        try {
            if (action === 'approve') {
                await updateDoc(doc(db, 'users', user.id), { approved: true });
            } else if (action === 'reject' || action === 'withdraw') {
                await deleteDoc(doc(db, 'users', user.id));
            }
        } catch (error) {
            console.error(`${action} 처리 중 오류 발생:`, error);
            // 여기에 사용자에게 오류를 알리는 로직을 추가할 수 있습니다.
            alert('작업 처리 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
        } finally {
            closeConfirmModal();
        }
    };
    
    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, user: null, action: null });
    };

    const openDetailModal = (user) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };
    
    const getConfirmModalText = () => {
        if (!confirmModal.action) return {};
        switch (confirmModal.action) {
            case 'approve': return { title: '승인', color: 'text_green' };
            case 'reject': return { title: '반려', color: 'text_yellow' };
            case 'withdraw': return { title: '탈퇴', color: 'text_danger' };
            default: return {};
        }
    };

    if (loading) return <Spinner />;
    
    return ( 
        <div className="page_container">
            <div className="page_header">
                <h2 className="page_title">로그인 신청 현황</h2>
                <div className="filter_group">
                    {divisions.map(division => (
                        <button
                            key={division}
                            onClick={() => setActiveFilter(division)}
                            className={`filter_button ${activeFilter === division ? 'active' : ''}`}
                        >
                            {division}
                        </button>
                    ))}
                </div>
            </div>

            <div className="table_wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>상태</th>
                            <th>이름</th>
                            <th>분과</th>
                            <th>소속</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td><span className={`status_badge ${user.approved ? 'status_green' : 'status_yellow'}`}>{user.approved ? '승인완료' : '승인대기'}</span></td>
                                <td>{user.name}</td>
                                <td>{user.division}</td>
                                <td>{user.affiliation}</td>
                                <td className="table_actions">
                                    <button onClick={() => openDetailModal(user)} className="button_link">상세</button>
                                    {user.approved ? (
                                        <button onClick={() => openConfirmModal(user, 'withdraw')} className="button_link text_danger">탈퇴</button>
                                    ) : (
                                        <>
                                            <button onClick={() => openConfirmModal(user, 'approve')} className="button_link text_green">승인</button>
                                            <button onClick={() => openConfirmModal(user, 'reject')} className="button_link text_yellow">반려</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredUsers.length === 0 && !loading && (
                    <div className="empty_message">
                        해당 그룹의 신청 현황이 없습니다.
                    </div>
                )}
            </div>

            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="의원 상세 정보">
                {selectedUser && (
                    <div className="detail_view">
                        <p><strong>이름:</strong> {selectedUser.name}</p>
                        <p><strong>이메일:</strong> {selectedUser.email}</p>
                        <p><strong>휴대폰번호:</strong> {selectedUser.phone}</p>
                        <p><strong>회사번호:</strong> {selectedUser.companyPhone || 'N/A'}</p>
                        <p><strong>소속:</strong> {selectedUser.affiliation}</p>
                        <p><strong>참여 희망 분과:</strong> {selectedUser.division}</p>
                        <p><strong>전문 분야:</strong> {selectedUser.expertise.join(', ')}</p>
                    </div>
                )}
            </Modal>

            <Modal isOpen={confirmModal.isOpen} onClose={closeConfirmModal} title="작업 확인" size="md">
                {confirmModal.user && (
                    <div>
                        <p>
                            <strong>{confirmModal.user.name}</strong>
                            <span style={{color: '#475569'}}>({confirmModal.user.email})</span> 님을
                        </p>
                        <p style={{fontSize: '1.25rem', fontWeight: '700', margin: '0.5rem 0'}}>
                            정말로 <span className={getConfirmModalText().color}>
                                {getConfirmModalText().title}
                            </span> 처리하시겠습니까?
                        </p>
                        {(confirmModal.action === 'reject' || confirmModal.action === 'withdraw') && 
                            <p className="text_danger" style={{fontSize: '0.875rem'}}>이 작업은 되돌릴 수 없으며, 사용자 데이터가 영구적으로 삭제됩니다.</p>
                        }
                        <div className="modal_footer">
                            <button onClick={closeConfirmModal} className="button button_secondary">취소</button>
                            <button onClick={handleConfirmAction} className={`button ${confirmModal.action === 'approve' ? 'button_green' : 'button_danger'}`}>
                                확인
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default UserManagement;