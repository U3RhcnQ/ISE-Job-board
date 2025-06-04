import React from 'react';
import { useDroppable } from '@dnd-kit/core';

export const Column = ({ id, title, children }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className='flex flex-col bg-muted/50 p-4 rounded-lg border'>
            <h2 className='text-xl font-bold mb-4 px-2'>{title}</h2>
            <div ref={setNodeRef} className='flex-grow min-h-[100px]'>
                {children}
            </div>
        </div>
    );
};
