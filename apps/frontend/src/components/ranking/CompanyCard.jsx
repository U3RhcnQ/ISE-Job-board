import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GripVertical, PlusCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

export const CompanyCard = ({ item, index, onCardClick, containerId }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // This function now handles the click and stops propagation
    const handleMoveClick = (e) => {
        // CRITICAL: Stop the click from triggering the drag listeners on the parent card
        e.stopPropagation();

        if (onCardClick) {
            onCardClick(item, containerId);
        }
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className=' relative touch-none cursor-grab py-4'
        >
            <CardHeader className='flex items-center justify-between'>
                <div className='flex items-center justify-between w-full'>
                    <div className='flex items-center'>
                        <div className='p-2 text-muted-foreground'>
                            <GripVertical size={20} />
                        </div>

                        {index && (
                            <span className='text-xl font-bold text-primary mr-4'>{index}.</span>
                        )}
                        <div>
                            <CardTitle>{item.companyName}</CardTitle>
                            <CardDescription>{item.jobTitle}</CardDescription>
                        </div>
                    </div>
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={handleMoveClick}
                        // Give the button a different cursor to show it's clickable
                        className='cursor-pointer'
                    >
                        {/* Show a different icon depending on which column it's in */}
                        {containerId === 'available-column' ? (
                            <PlusCircle className='!h-6 !w-6 text-green-500' />
                        ) : (
                            <XCircle className='!h-6 !w-6 text-red-500' />
                        )}
                    </Button>
                </div>
            </CardHeader>
        </Card>
    );
};
