import React, {useState, useEffect, useMemo, useRef} from 'react';
import { DndContext, DragOverlay, rectIntersection, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Column } from '@/components/ranking/Column';
import { CompanyCard } from '@/components/ranking/CompanyCard';
// Why so many ?
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import JobDetailPage from "@/pages/JobDetailPage.jsx";

// Use these keys to store our data in localStorage
const RANKED_ITEMS_STORAGE_KEY = 'rankedItems';
const AVAILABLE_ITEMS_STORAGE_KEY = 'availableItems';

// MOCK DATA: In a real app, you would fetch this from your API.
const mockCompanies = Array.from({ length: 50 }, (_, i) => ({
    id: `company-${i + 1}`,
    companyName: `Tech Corp ${i + 1}`,
    jobName: `Software Engineer ${i + 1}`,
}));

const TOTAL_COMPANIES = 50;

export const Ranking = () => {

    // Get saved data if we have any
    const [availableItems, setAvailableItems] = useState([]);
    const [rankedItems, setRankedItems] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    //State to hold the item being dragged for the DragOverlay
    const [activeItem, setActiveItem] = useState(null);
    // Use a ref to track the last user action type
    const lastActionType = useRef(null);
    const rankedColumnRef = useRef(null);

    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
    const [isSubmitSuccessAlertOpen, setIsSubmitSuccessAlertOpen] = useState(false);

    useEffect(() => {
        // In a real app, this would be your API call to get all 50 companies.
        const allCompanies = mockCompanies;

        // Load only the ranked items from storage.
        const savedRanked = JSON.parse(localStorage.getItem(RANKED_ITEMS_STORAGE_KEY) || 'null');

        if (savedRanked && savedRanked.length > 0) {
            // If we have saved rankings, use them as the source of truth.
            const rankedIds = new Set(savedRanked.map(item => item.id));

            // The available list is CALCULATED by taking the full list and filtering out the ranked ones.
            const calculatedAvailable = allCompanies.filter(item => !rankedIds.has(item.id));

            setRankedItems(savedRanked);
            setAvailableItems(calculatedAvailable);
        } else {
            // This is a completely fresh session.
            setAvailableItems(allCompanies);
            setRankedItems([]);
        }

        setIsLoading(false);
    }, []); // This runs only once on mount.


    // Save the state into local storage
    useEffect(() => {
        if (!isLoading) {
            // We use JSON.stringify because localStorage can only store strings.
            localStorage.setItem(RANKED_ITEMS_STORAGE_KEY, JSON.stringify(rankedItems));
        }
    }, [rankedItems, availableItems, isLoading]); // This effect runs every time the lists are modified.


    // useEffect for auto-scrolling.
    useEffect(() => {

        if (!lastActionType.current) {
            return;
        } // Do nothing if no relevant action occurred

        const columnNode = rankedColumnRef.current;
        if (!columnNode) {
            return;
        } // No column selected

        const lastItemInRankedList = rankedItems[rankedItems.length - 1];

        // Scenario 1: The user clicked to add, which always goes to the bottom.
        if (lastActionType.current === 'click-add') {
            columnNode.scrollTo({ top: columnNode.scrollHeight, behavior: 'smooth' });
        }

        // Scenario 2: The user finished a drag from available to ranked.
        // Check if the dragged item is now the last one in the list.
        if (lastActionType.current === 'drag-add' && activeItem?.id === lastItemInRankedList?.id) {
            columnNode.scrollTo({ top: columnNode.scrollHeight, behavior: 'smooth' });
        }

        // Reset the action type after we're done.
        lastActionType.current = null;

    }, [rankedItems, activeItem]); // Effect runs when the list or activeItem changes



    // useMemo to avoid re-calculating on every render
    const filteredAvailableItems = useMemo(
        () =>
            availableItems.filter((item) =>
                item.companyName.toLowerCase().includes(searchTerm.toLowerCase())
            ),
        [availableItems, searchTerm]
    );

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // User must move the mouse 10px before a drag starts
            },
        })
    );

    const handleDragStart = (event) => {
        // When a drag starts, find the item data and set it as active
        const { active } = event;
        const item = [...availableItems, ...rankedItems].find(i => i.id === active.id);
        setActiveItem(item);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const activeContainer = active.data.current.sortable.containerId;
        const overContainer = over.data.current?.sortable.containerId || over.id;

        if (activeContainer === overContainer) {
            return;
        }
        // Check if the active item is already in the target column in our state
        const isAlreadyInRanked = rankedItems.some(item => item.id === activeId);
        if (overContainer === 'ranked-column' && isAlreadyInRanked) {
            return;
        }
        const isAlreadyInAvailable = availableItems.some(item => item.id === activeId);
        if (overContainer === 'available-column' && isAlreadyInAvailable) {
            return;
        }

        // Find the item being dragged
        const activeIndex = activeContainer === 'available-column'
            ? availableItems.findIndex(item => item.id === active.id)
            : rankedItems.findIndex(item => item.id === active.id);

        let itemToMove;

        // Remove from the source array
        if (activeContainer === 'available-column') {
            itemToMove = availableItems[activeIndex];
            setAvailableItems(prev => prev.filter(item => item.id !== active.id));
        } else {
            itemToMove = rankedItems[activeIndex];
            setRankedItems(prev => prev.filter(item => item.id !== active.id));
        }

        // Add to the destination array
        if (overContainer === 'available-column') {
            setAvailableItems(prev => [...prev, itemToMove]);
        } else {
            const overIndex = rankedItems.findIndex(item => item.id === over.id);
            const newIndex = overIndex === -1 ? rankedItems.length : overIndex;
            setRankedItems(prev => [...prev.slice(0, newIndex), itemToMove, ...prev.slice(newIndex)]);
        }
    };


    const handleDragEnd = (event) => {
        const { active, over } = event;

        // This now only handles re-ordering within the 'ranked' column
        if (over && active.id !== over.id) {
            const activeContainer = active.data.current.sortable.containerId;
            const overContainer = over.data.current?.sortable.containerId || over.id;

            if (activeContainer === overContainer && activeContainer === 'ranked-column') {
                setRankedItems((items) => {
                    const oldIndex = items.findIndex((item) => item.id === active.id);
                    const newIndex = items.findIndex((item) => item.id === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
            }

            // If an item was dragged from available to ranked, set the action type
            if(activeContainer === 'available-column' && overContainer === 'ranked-column') {
                lastActionType.current = 'drag-add';
            }

        }
        setActiveItem(null);
    };

    const handleMoveCard = (card, sourceContainer) => {
        if (sourceContainer === 'available-column') {
            // Move from Available to Ranked
            setAvailableItems(prev => prev.filter(item => item.id !== card.id));
            setRankedItems(prev => [...prev, card]);
            lastActionType.current = 'click-add';
        } else if (sourceContainer === 'ranked-column') {
            // Move from Ranked to Available
            setRankedItems(prev => prev.filter(item => item.id !== card.id));
            setAvailableItems(prev => [card, ...prev]);
        }
    }

    const handleSubmit = () => {
        if (rankedItems.length !== TOTAL_COMPANIES) {
            alert(`Please rank all ${TOTAL_COMPANIES} companies before submitting.`);
            return;
        }
        const rankedIds = rankedItems.map(item => item.id);
        console.log("Submitting ranked IDs:", rankedIds);
        // TODO: Add your fetch POST/PUT request here to send `rankedIds` to your API
        // e.g., fetch('/api/v1/rankings', { method: 'POST', body: JSON.stringify({ companyIds: rankedIds }) })
        setIsSubmitSuccessAlertOpen(true);
    };

    const handleReset = () => {

        localStorage.removeItem(RANKED_ITEMS_STORAGE_KEY);
        localStorage.removeItem(AVAILABLE_ITEMS_STORAGE_KEY);
        setRankedItems([]);
        setAvailableItems(mockCompanies);

    }

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto p-2 md:p-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-8">
                <div className="text-center md:text-left ">
                    <h1 className="text-3xl font-bold">Company Rankings</h1>
                    <p className="text-muted-foreground pt-1 pb-1">Drag companies from the left to your ranked list on the right. You can reorder your ranked list at any time.</p>
                </div>
                <div className="font-semibold text-xl text-green-600 pr-2">
                    <p>Progress: {rankedItems.length}/{TOTAL_COMPANIES}</p>
                </div>
            </div>

            <DndContext sensors={sensors}
                        collisionDetection={rectIntersection}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Available Companies Column */}
                    <Column id="available-column" title="Available Companies">
                        <Input
                            type="text"
                            placeholder="Search companies..."
                            className="mb-4"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <SortableContext id="available-column" items={filteredAvailableItems} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3 h-[60vh] overflow-y-auto p-2">
                                {filteredAvailableItems.map(item => (
                                    <CompanyCard key={item.id}
                                                 item={item}
                                                 onCardClick={handleMoveCard}
                                                 containerId="available-column"
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </Column>

                    {/* Ranked Companies Column */}
                    <Column id="ranked-column" title="Your Rankings">
                        <SortableContext id="ranked-column" items={rankedItems} strategy={verticalListSortingStrategy}>
                            <div ref={rankedColumnRef} className="space-y-3 h-[65vh] overflow-y-auto p-2">
                                {rankedItems.map((item, index) => (
                                    <CompanyCard key={item.id}
                                                 item={item}
                                                 index={index + 1}
                                                 onCardClick={handleMoveCard}
                                                 containerId="ranked-column"
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </Column>
                </div>

                {/* The DragOverlay renders a clone of the card while dragging */}
                <DragOverlay>
                    {activeItem ? <CompanyCard item={activeItem}/> : null}
                </DragOverlay>
            </DndContext>

            <div className="flex justify-between items-center mt-8">
                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Reset Rankings</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently clear all your
                                current rankings and saved progress.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                                Yes, Reset
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button
                            size="lg"
                            disabled={rankedItems.length !== TOTAL_COMPANIES} // Keep disabled logic on trigger
                            className={"bg-green-600 hover:bg-green-700"}
                        >
                            Submit Final Rankings
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to submit your final rankings? You will not be
                                able to make changes after this.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className={"bg-green-600 hover:bg-green-700"} onClick={handleSubmit}>Yes, Submit</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>


                {/* Dialog for Submission Success Message */}
                <AlertDialog open={isSubmitSuccessAlertOpen} onOpenChange={setIsSubmitSuccessAlertOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Rankings Submitted!</AlertDialogTitle>
                            <AlertDialogDescription>
                                Your rankings have been successfully submitted. Thank you!
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction className={"bg-green-600 hover:bg-green-700"} onClick={() => setIsSubmitSuccessAlertOpen(false)}>OK</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>


            </div>
        </div>
    );
};

export default Ranking;