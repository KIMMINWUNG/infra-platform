// --- /src/pages/admin/ProposalEvaluation.jsx ---
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';

const ProposalEvaluation = () => {
    const [allProposals, setAllProposals] = useState([]);
    const [filteredProposals, setFilteredProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [evaluation, setEvaluation] = useState({ 정합성: 3, 가능성: 3, '필요 및 시급성': 3, 기대효과: 3 });
    const [activeFilter, setActiveFilter] = useState('전체');
    const divisions = ['전체', '교통', '유통공급', '방재', '환경기초'];

    const evaluationCriteria = { '정합성': '제안이 기반시설관리법의 정책 방향 및 제도와 잘 연계되는가?', '가능성': '제안이 현실적으로 시행 가능한 수준의 구체성, 실행력을 갖추었는가?', '필요 및 시급성': '문제 해결이 시급하고, 현안 대응에 우선적으로 반영하여야 하는가?', '기대효과': '제안이 제도 개선 등 구체적 성과로 이어질 수 있는가?' };
    const scoreMap = { '매우 우수': 5, '우수': 4, '보통': 3, '미흡': 2, '매우 미흡': 1 };
    const scoreLabels = Object.keys(scoreMap);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'proposals'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const proposalList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            proposalList.sort((a, b) => {
                const statusOrder = { 'pending': 1, 'review': 2, 'approved': 3, 'rejected': 4 };
                const dateA = a.createdAt?.toDate() || 0;
                const dateB = b.createdAt?.toDate() || 0;
                if ((statusOrder[a.status] || 99) !== (statusOrder[b.status] || 99)) {
                    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                }
                return dateB - dateA;
            });
            setAllProposals(proposalList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (activeFilter === '전체') {
            setFilteredProposals(allProposals);
        } else {
            setFilteredProposals(allProposals.filter(p => p.division === activeFilter));
        }
    }, [activeFilter, allProposals]);

    const openEvaluationModal = (proposal) => {
        setSelectedProposal(proposal);
        setEvaluation(proposal.evaluationDetails || { 정합성: 3, 가능성: 3, '필요 및 시급성': 3, 기대효과: 3 });
        setIsModalOpen(true);
    };

    const handleEvaluationChange = (criterion, score) => {
        setEvaluation(prev => ({ ...prev, [criterion]: score }));
    };

    const handleEvaluationSubmit = async () => {
        if (!selectedProposal) return;
        const totalPoints = Object.values(evaluation).reduce((sum, score) => sum + score, 0);
        const totalScore = (totalPoints / (Object.keys(evaluation).length * 5)) * 100;
        let status;
        if (totalScore >= 70) status = 'approved';
        else if (totalScore >= 50) status = 'review'; // Adjusted threshold
        else status = 'rejected';
        
        try {
            await updateDoc(doc(db, 'proposals', selectedProposal.id), {
                status,
                score: Math.round(totalScore),
                evaluationDetails: evaluation
            });
        } catch (error) {
            console.error("평가 제출 오류:", error);
        } finally {
            setIsModalOpen(false);
        }
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full";
        switch (status) {
            case 'approved': return <span className={`${baseClasses} bg-green-100 text-green-800`}>채택</span>;
            case 'review': return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>재검토</span>;
            case 'rejected': return <span className={`${baseClasses} bg-red-100 text-red-800`}>미채택</span>;
            default: return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>평가대기</span>;
        }
    };

    if (loading) return <Spinner />;
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-800">협의체 안건 평가</h2>
                <div className="flex space-x-1 p-1 bg-slate-100 rounded-lg">
                    {divisions.map(division => (
                        <button
                            key={division}
                            onClick={() => setActiveFilter(division)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition ${activeFilter === division ? 'bg-white text-blue-600 shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                        >
                            {division}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase">상태</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase">분과</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase">제목</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase">제안자</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase">점수</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredProposals.map(p => (
                            <tr key={p.id}>
                                <td className="py-4 px-4 whitespace-nowrap">{getStatusBadge(p.status)}</td>
                                <td className="py-4 px-4">{p.division || '미지정'}</td>
                                <td className="py-4 px-4 font-medium text-slate-800">{p.title}</td>
                                <td className="py-4 px-4">{p.proposerName}</td>
                                <td className="py-4 px-4 font-bold text-slate-700">{p.score ?? 'N/A'}</td>
                                <td className="py-4 px-4">
                                    <button onClick={() => openEvaluationModal(p)} className="text-indigo-600 hover:text-indigo-900 font-medium">{p.status === 'pending' ? '평가하기' : '수정/보기'}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredProposals.length === 0 && !loading && (
                    <div className="text-center py-10 text-slate-500">
                        해당 분과의 안건이 없습니다.
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`'${selectedProposal?.title}' 안건 평가`} size="4xl">
                {selectedProposal && (
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-slate-800">제안 배경</h4>
                            <p className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap text-slate-700">{selectedProposal.background || '내용 없음'}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-slate-800">주요 내용</h4>
                            <p className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap text-slate-700">{selectedProposal.content || '내용 없음'}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-slate-800">기대 효과</h4>
                            <p className="p-4 bg-slate-50 rounded-md whitespace-pre-wrap text-slate-700">{selectedProposal.effects || '내용 없음'}</p>
                        </div>
                        
                        <div className="space-y-5 pt-5 border-t border-slate-200">
                            {Object.entries(evaluationCriteria).map(([criterion, description]) => (
                                <div key={criterion}>
                                    <h5 className="font-semibold text-slate-800">{criterion}</h5>
                                    <p className="text-sm text-slate-600 mb-2">{description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {scoreLabels.map(label => (
                                            <button key={label} onClick={() => handleEvaluationChange(criterion, scoreMap[label])} className={`px-3 py-1 text-sm rounded-full transition font-medium ${evaluation[criterion] === scoreMap[label] ? 'bg-blue-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>{label}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-6 border-t border-slate-200">
                            <button onClick={handleEvaluationSubmit} className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition">
                                {selectedProposal.status === 'pending' ? '평가 완료' : '평가 수정하기'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
export default ProposalEvaluation;