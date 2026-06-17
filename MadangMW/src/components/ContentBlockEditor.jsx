import React, { useRef } from 'react';
import { uploadImage } from '../api';
import { getImageUrl } from './MobilePreview';

// Reusable Image Uploader component for other screens
export function ImageUploader({ onUpload, token }) {
    const inputRef = useRef(null);

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const formData = new FormData();
            formData.append('image', file);
            const result = await uploadImage(formData);
            onUpload(result.url);
        } catch (error) {
            alert('이미지 업로드 실패');
        }
    };

    return (
        <div 
            onClick={() => inputRef.current.click()}
            style={{
                width: '100%', height: '100%', border: '2px dashed #dee2e6', borderRadius: 16,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', background: 'white', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = '#3182f6'}
            onMouseOut={e => e.currentTarget.style.borderColor = '#dee2e6'}
        >
            <span style={{ fontSize: 24, marginBottom: 4 }}>+</span>
            <span style={{ fontSize: 12, color: '#8b95a1', fontWeight: 600 }}>사진 추가</span>
            <input type="file" accept="image/*" style={{ display: 'none' }} ref={inputRef} onChange={handleFile} />
        </div>
    );
}

export default function ContentBlockEditor({ blocks, onChange, token, hideImages = false, disabled = false }) {
    const fileInputRefs = useRef({});

    const addBlock = (type) => {
        if (disabled) return;
        onChange([...blocks, { type, content: '' }]);
    };

    const updateBlock = (index, content) => {
        if (disabled) return;
        const newBlocks = [...blocks];
        newBlocks[index].content = content;
        onChange(newBlocks);
    };

    const moveBlock = (index, direction) => {
        if (disabled) return;
        const newBlocks = [...blocks];
        if (direction === 'up' && index > 0) {
            [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
        } else if (direction === 'down' && index < newBlocks.length - 1) {
            [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
        }
        onChange(newBlocks);
    };

    const removeBlock = (index) => {
        if (disabled) return;
        onChange(blocks.filter((_, i) => i !== index));
    };

    const handleFileUpload = async (index, e) => {
        if (disabled) return;
        const file = e.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('image', file);
            const result = await uploadImage(formData);
            updateBlock(index, result.url);
        } catch (error) {
            console.error(error);
            alert('이미지 업로드 실패');
        }
    };

    const triggerFileInput = (index) => {
        if (disabled) return;
        if (fileInputRefs.current[index]) {
            fileInputRefs.current[index].click();
        }
    };

    return (
        <div style={{ background: '#f9fafb', padding: 20, borderRadius: 16, border: '1px solid #e5e8eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h4 style={{ margin: 0, fontSize: 15 }}>📝 상세 설명 꾸미기</h4>
                {!disabled && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn-secondary" onClick={() => addBlock('TEXT')} style={{ height: 32, padding: '0 12px', fontSize: 13 }}>+ 글 쓰기</button>
                        {!hideImages && <button type="button" className="btn-secondary" onClick={() => addBlock('IMAGE')} style={{ height: 32, padding: '0 12px', fontSize: 13 }}>+ 사진</button>}
                        <button type="button" className="btn-secondary" onClick={() => addBlock('VIDEO')} style={{ height: 32, padding: '0 12px', fontSize: 13 }}>+ 영상</button>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {blocks.map((block, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        gap: 16,
                        background: 'white',
                        padding: 16,
                        borderRadius: 12,
                        border: '1px solid #e5e8eb'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#8b95a1', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 22, height: 22, background: '#f2f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4e5968', fontSize: 11 }}>{index + 1}</span>
                                {block.type === 'TEXT' ? '글 입력' : block.type === 'IMAGE' ? '사진 주소/업로드' : 'YouTube 동영상'}
                            </div>

                            {block.type === 'TEXT' ? (
                                <textarea
                                    className="form-control"
                                    value={block.content}
                                    onChange={(e) => updateBlock(index, e.target.value)}
                                    placeholder="상세 내용을 입력하세요..."
                                    disabled={disabled}
                                    style={{ width: '100%', minHeight: 120, padding: 12, resize: 'vertical' }}
                                />
                            ) : block.type === 'IMAGE' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            value={block.content}
                                            onChange={(e) => updateBlock(index, e.target.value)}
                                            placeholder="이미지 주소..."
                                            disabled={disabled}
                                            style={{ flex: 1, height: 40 }}
                                        />
                                        <input type="file" accept="image/*" style={{ display: 'none' }} ref={el => fileInputRefs.current[index] = el} onChange={(e) => handleFileUpload(index, e)} />
                                        {!disabled && <button type="button" className="btn-secondary" onClick={() => triggerFileInput(index)} style={{ height: 40, whiteSpace: 'nowrap' }}>파일 찾기</button>}
                                    </div>
                                    {block.content && (
                                        <div style={{ marginTop: 8, width: 120, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e8eb' }}>
                                            <img src={getImageUrl(block.content)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Content Thumbnail" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input
                                    value={block.content}
                                    onChange={(e) => updateBlock(index, e.target.value)}
                                    placeholder="유튜브 링크 입력 (예: https://...)"
                                    disabled={disabled}
                                    style={{ width: '100%', height: 40 }}
                                />
                            )}
                        </div>

                        {!disabled && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <button type="button" onClick={() => moveBlock(index, 'up')} disabled={index === 0} style={{ width: 32, height: 32, borderRadius: 8, background: '#f9fafb', fontSize: 12 }}>▲</button>
                                <button type="button" onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} style={{ width: 32, height: 32, borderRadius: 8, background: '#f9fafb', fontSize: 12 }}>▼</button>
                                <button type="button" onClick={() => removeBlock(index)} style={{ width: 32, height: 32, borderRadius: 8, background: '#fff0f0', color: '#f04452', fontSize: 12 }}>✕</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {blocks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#8b95a1' }}>
                    <p style={{ margin: 0, fontSize: 13 }}>블록을 추가하여 풍부한 상세 설명을 작성해 보세요.</p>
                </div>
            )}
        </div>
    );
}
