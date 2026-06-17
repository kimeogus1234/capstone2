import React from 'react';

const getYouTubeVideoId = (url) => {
    if (!url) return null;

    const regExp =
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;

    const match = url.match(regExp);
    return match ? match[1] : null;
};

export default function ContentBlockRenderer({ block }) {
    if (!block || !block.type) return null;

    if (block.type === 'TEXT') {
        return (
            <p style={{ fontSize: 14, color: '#4e5968', lineHeight: 1.6, marginBottom: 16 }}>
                {block.content}
            </p>
        );
    }

    if (block.type === 'IMAGE') {
        return (
            <img
                src={block.content}
                style={{ width: '100%', borderRadius: 12, marginBottom: 16 }}
                alt=""
            />
        );
    }

    if (block.type === 'VIDEO') {
        const videoId = getYouTubeVideoId(block.content);
        if (!videoId) return null;

        return (
            <div
                style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#000',
                    marginBottom: 16
                }}
            >
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        );
    }

    return null;
}
