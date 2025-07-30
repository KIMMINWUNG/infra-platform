// --- /src/components/Modal.jsx ---
import React from 'react';

const Modal = ({ isOpen, onClose, title, children, size = '2xl' }) => {
    if (!isOpen) return null;

    // App.css에 정의된 클래스명을 사용합니다.
    const sizeClass = `modal_${size}`;

    return (
        <div className="modal_overlay">
            <div className={`modal_container ${sizeClass}`}>
                <div className="modal_header">
                    <h3 className="modal_title">{title}</h3>
                    <button onClick={onClose} className="modal_closeButton">&times;</button>
                </div>
                <div className="modal_content">{children}</div>
            </div>
        </div>
    );
};
export default Modal;