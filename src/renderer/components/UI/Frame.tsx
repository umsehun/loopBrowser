import React from 'react';

interface FrameProps {
    children: React.ReactNode;
}

const Frame: React.FC<FrameProps> = ({ children }) => {
    return (
        <div className="h-screen bg-gray-200 dark:bg-gray-800 p-5">
            {/* 20px outer border with rounded corners and shadow */}
            <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                {children}
            </div>
        </div>
    );
};

export default Frame;