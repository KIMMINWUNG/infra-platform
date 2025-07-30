// --- /src/pages/member/MeetingResultsView.jsx ---
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const MeetingResultsView = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const reportRef = useRef();

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'meeting_results'), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const resultsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setResults(resultsList);
            setLoading(false);
        }, (error) => {
            console.error("회의 결과 로딩 오류:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const openModal = (result) => {
        setSelectedResult(result);
        setIsModalOpen(true);
    };

    const handlePrintPdf = () => {
        const reportElement = reportRef.current;
        if (!reportElement) return;

        setTimeout(() => {
            // ✅ useCORS 옵션은 여전히 필요합니다.
            html2canvas(reportElement, { scale: 2, useCORS: true }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF('p', 'mm', 'a4');
                
                const imgWidth = 210; 
                const pageHeight = 297;
                const imgHeight = canvas.height * imgWidth / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = -pageHeight * (Math.ceil(imgHeight / pageHeight) - Math.ceil(heightLeft / pageHeight));
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                pdf.save(`${selectedResult.meetingTitle}_회의록.pdf`);
            });
        }, 200);
    };

    if (loading) return <Spinner />;

    return (
        <div className="page_container">
            <h2 className="page_title">협의체 회의 결과</h2>
            <div className="list_container">
                {results.length > 0 ? results.map(r => (
                    <div key={r.id} className="list_item_card">
                        <div>
                            <h3 className="list_item_title">{r.meetingTitle}</h3>
                            <p className="list_item_subtitle">회의 일자: {r.meetingDate}</p>
                        </div>
                        <button onClick={() => openModal(r)} className="button button_secondary">결과 보기</button>
                    </div>
                )) : <p className="empty_message">공유된 회의 결과가 없습니다.</p>}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="회의 결과 상세" size="4xl">
                {selectedResult && (
                    <div>
                        <div ref={reportRef} className="pdf_export_area">
                            <h3 className="pdf_title">{selectedResult.meetingTitle} 회의록</h3>
                            <div className="pdf_meta">
                                <p><strong>- 일시:</strong> {selectedResult.meetingDate}</p>
                                <p><strong>- 장소:</strong> {selectedResult.meetingLocation}</p>
                            </div>
                            <div className="pdf_section">
                                <h4 className="pdf_section_title">- 참석자 명단</h4>
                                <ul className="pdf_list">
                                    {selectedResult.attendeesData?.map(a => 
                                    <li key={a.id}>{a.name} ({a.affiliation})</li>
                                    )}
                                </ul>
                            </div>
                            {selectedResult.imageUrl && (
                                <div className="pdf_section">
                                    <h4 className="pdf_section_title">- 관련 사진</h4>
                                    <div className="image_wrapper">
                                        {/* ✅ crossOrigin 속성을 제거하여 웹에서 이미지가 깨지지 않도록 합니다. */}
                                        <img src={selectedResult.imageUrl} alt={`${selectedResult.meetingTitle} 관련 사진`} className="pdf_image" />
                                    </div>
                                </div>
                            )}
                            <div className="pdf_section">
                                <h4 className="pdf_section_title">- 주요 논의 내용</h4>
                                <p className="pdf_content">{selectedResult.discussion}</p>
                            </div>
                        </div>
                        <div className="modal_footer" style={{backgroundColor: '#f8fafc', borderRadius: '0 0 0.5rem 0.5rem'}}>
                            <button onClick={handlePrintPdf} className="button button_secondary">
                                PDF로 출력
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MeetingResultsView;