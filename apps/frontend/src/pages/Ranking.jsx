import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    DndContext,
    DragOverlay,
    rectIntersection,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Column } from '../components/ranking/Column';
import { CompanyCard } from '../components/ranking/CompanyCard';
import { useAuth } from '../hooks/useAuth.js';
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
} from '../components/ui/alert-dialog';
import loadingSpinner from "@/components/loadingSpinner.jsx";

// Use these keys to store our data in localStorage
const RANKED_ITEMS_STORAGE_KEY = 'rankedItems';
const AVAILABLE_ITEMS_STORAGE_KEY = 'availableItems';

const API_BASE_URL = 'http://localhost:8080/api/v1';


export const Ranking = () => {

    const { user, token } = useAuth();

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

    const [allFetchedCompanies, setAllFetchedCompanies] = useState([]); // To store companies from API
    const [totalCompaniesFromAPI, setTotalCompaniesFromAPI] = useState(0); // For dynamic total


    useEffect(() => {
        const loadData = async () => {
            // Ensure user and token are available before fetching
            // and user.year is present for the API call.
            if (!user || !token || user.year === undefined) {
                console.log("User, token, or user.year not available yet. Waiting...");
                setIsLoading(false); // Potentially set to false or handle differently
                return;
            }

            setIsLoading(true);
            let rawCompaniesData = []; // Store raw API response
            let processedCompaniesData = [];

            //Default for Year, 2,3,4
            let residencyYear = user.year;
            if (user.year === 1 && (new Date().getMonth() * 100 + new Date().getDate()) > (6 * 100 + 23)) {
                residencyYear = 2;
            }

            try {
                // Your API call logic
                const response = await fetch(`${API_BASE_URL}/jobs-to-rank?residency=r${residencyYear}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(
                        `Fetch error: ${response.status} - ${errorText || response.statusText}`
                    );
                }
                rawCompaniesData = await response.json();

                processedCompaniesData = rawCompaniesData.map(company => ({
                    ...company,
                    id: String(company.jobId) // Assuming 'jobId' is the unique ID from your API. Convert to string for consistency.
                    // Ensure 'jobId' exists and is unique for each item.
                }));

                // Ensure the data structure matches what CompanyCard expects:
                // e.g., [{ id: '...', companyName: '...', jobName: '...' }, ...]

                setAllFetchedCompanies(processedCompaniesData); // Store all fetched companies
                setTotalCompaniesFromAPI(processedCompaniesData.length); // Update total based on API response

            } catch (err) {
                console.error('Fetch job details error:', err);
                // Handle error appropriately, e.g., show error message to user
                setAllFetchedCompanies([]);
                setAvailableItems([]);
                setRankedItems([]);
                setTotalCompaniesFromAPI(0);
                setIsLoading(false);
                return; // Exit if fetch failed
            }

            // Load ranked items from storage
            const savedRankedJSON = localStorage.getItem(RANKED_ITEMS_STORAGE_KEY);
            const savedRanked = savedRankedJSON ? JSON.parse(savedRankedJSON) : null;

            if (savedRanked && savedRanked.length > 0) {
                // Ensure saved ranked items are still valid against the newly fetched company list (optional, but good for data integrity)
                const validSavedRanked = savedRanked.filter(sItem => processedCompaniesData.some(cItem => cItem.id === sItem.id));
                const rankedIds = new Set(validSavedRanked.map((item) => item.id));
                const calculatedAvailable = processedCompaniesData.filter((item) => !rankedIds.has(item.id));

                setRankedItems(validSavedRanked);
                setAvailableItems(calculatedAvailable);
            } else {
                // Fresh session or no valid saved rankings
                setAvailableItems(processedCompaniesData);
                setRankedItems([]);
            }

            setIsLoading(false);
        };

        loadData();
        // Add user, token, and user.year (if it can change independently of user object) to dependency array
        // This ensures data is refetched if auth details change.
    }, [user, token]);

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
                item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || item.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
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
        const item = [...availableItems, ...rankedItems].find((i) => i.id === active.id);
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
        const isAlreadyInRanked = rankedItems.some((item) => item.id === activeId);
        if (overContainer === 'ranked-column' && isAlreadyInRanked) {
            return;
        }
        const isAlreadyInAvailable = availableItems.some((item) => item.id === activeId);
        if (overContainer === 'available-column' && isAlreadyInAvailable) {
            return;
        }

        // Find the item being dragged
        const activeIndex =
            activeContainer === 'available-column'
                ? availableItems.findIndex((item) => item.id === active.id)
                : rankedItems.findIndex((item) => item.id === active.id);

        let itemToMove;

        // Remove from the source array
        if (activeContainer === 'available-column') {
            itemToMove = availableItems[activeIndex];
            setAvailableItems((prev) => prev.filter((item) => item.id !== active.id));
        } else {
            itemToMove = rankedItems[activeIndex];
            setRankedItems((prev) => prev.filter((item) => item.id !== active.id));
        }

        // Add to the destination array
        if (overContainer === 'available-column') {
            setAvailableItems((prev) => [...prev, itemToMove]);
        } else {
            const overIndex = rankedItems.findIndex((item) => item.id === over.id);
            const newIndex = overIndex === -1 ? rankedItems.length : overIndex;
            setRankedItems((prev) => [
                ...prev.slice(0, newIndex),
                itemToMove,
                ...prev.slice(newIndex),
            ]);
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
            if (activeContainer === 'available-column' && overContainer === 'ranked-column') {
                lastActionType.current = 'drag-add';
            }
        }
        setActiveItem(null);
    };

    const handleMoveCard = (card, sourceContainer) => {
        if (sourceContainer === 'available-column') {
            // Move from Available to Ranked
            setAvailableItems((prev) => prev.filter((item) => item.id !== card.id));
            setRankedItems((prev) => [...prev, card]);
            lastActionType.current = 'click-add';
        } else if (sourceContainer === 'ranked-column') {
            // Move from Ranked to Available
            setRankedItems((prev) => prev.filter((item) => item.id !== card.id));
            setAvailableItems((prev) => [card, ...prev]);
        }
    };

    const handleSubmit = async () => { // Make it async if your fetch call is async
        if (rankedItems.length !== totalCompaniesFromAPI) {
            alert(`Please rank all ${totalCompaniesFromAPI} companies before submitting.`);
            setIsSubmitDialogOpen(false); // Close the confirmation dialog if validation fails
            return;
        }

        // Transform rankedItems into the desired payload format
        const payload = rankedItems.map((item, index) => ({
            preference: String(index + 1), // Preference is 1-based index, ensure it's a string
            jobId: String(item.id)        // Ensure jobId is a string (it likely already is from your mapping)
        }));

        console.log('Submitting payload:', payload);
        setIsSubmitDialogOpen(false); // Close the confirmation dialog before submitting or on success

        try {
            // Your actual API endpoint and method (POST or PUT)
            const response = await fetch(`${API_BASE_URL}/set-preferences`, { // Example endpoint
                method: 'POST', // Or 'PUT' depending on your API design
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Assuming you need auth
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.text(); // Or response.json() if your API sends JSON errors
                console.error('Submission error:', response.status, errorData);
                alert(`Submission failed: ${response.status} - ${errorData || 'Unknown error'}`);
                // Potentially handle specific error codes here
                return; // Don't show success if submission failed
            }

            // If submission is successful:
            const result = await response.json(); // Or response.text() if no JSON body is returned
            console.log('Submission successful:', result);
            setIsSubmitSuccessAlertOpen(true);

            // Optionally, clear local storage and reset state after successful submission
            // localStorage.removeItem(RANKED_ITEMS_STORAGE_KEY);
            // localStorage.removeItem(AVAILABLE_ITEMS_STORAGE_KEY);
            // setRankedItems([]);
            // setAvailableItems(allFetchedCompanies); // Or an empty array if they shouldn't re-rank immediately

        } catch (error) {
            console.error('Network or other error during submission:', error);
            alert(`An error occurred during submission: ${error.message}`);
        }
    };

    const handleReset = () => {
        localStorage.removeItem(RANKED_ITEMS_STORAGE_KEY);
        localStorage.removeItem(AVAILABLE_ITEMS_STORAGE_KEY);
        setRankedItems([]);
        setAvailableItems(allFetchedCompanies);
    };

    if (isLoading) return loadingSpinner({text: 'Loading Ranking data...'});

    return (
        <div className='container mx-auto p-2 md:p-4'>
            <div className='flex flex-col md:flex-row justify-between items-end gap-4 pb-8'>
                <div className='text-center md:text-left '>
                    <h1 className='text-3xl font-bold'>Company Rankings</h1>
                    <p className='text-muted-foreground pt-1 pb-1'>
                        Drag companies from the left to your ranked list on the right. You can
                        reorder your ranked list at any time.
                    </p>
                </div>
                <div className='font-semibold text-xl text-green-600 pr-2'>
                    <p>
                        Progress: {rankedItems.length}/{totalCompaniesFromAPI}
                    </p>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    {/* Available Companies Column */}
                    <Column id='available-column' title='Available Companies'>
                        <Input
                            type='text'
                            placeholder='Search companies...'
                            className='mb-4'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <SortableContext
                            id='available-column'
                            items={filteredAvailableItems}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className='space-y-3 h-[60vh] overflow-y-auto p-2'>
                                {filteredAvailableItems.map((item) => (
                                    <CompanyCard
                                        key={item.id}
                                        item={item}
                                        onCardClick={handleMoveCard}
                                        containerId='available-column'
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </Column>

                    {/* Ranked Companies Column */}
                    <Column id='ranked-column' title='Your Rankings'>
                        <SortableContext
                            id='ranked-column'
                            items={rankedItems}
                            strategy={verticalListSortingStrategy}
                        >
                            <div
                                ref={rankedColumnRef}
                                className='space-y-3 h-[65vh] overflow-y-auto p-2'
                            >
                                {rankedItems.map((item, index) => (
                                    <CompanyCard
                                        key={item.id}
                                        item={item}
                                        index={index + 1}
                                        onCardClick={handleMoveCard}
                                        containerId='ranked-column'
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </Column>
                </div>

                {/* The DragOverlay renders a clone of the card while dragging */}
                <DragOverlay>{activeItem ? <CompanyCard item={activeItem} /> : null}</DragOverlay>
            </DndContext>

            <div className='flex justify-between items-center mt-8'>
                <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant='destructive'>Reset Rankings</Button>
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
                            <AlertDialogAction
                                onClick={handleReset}
                                className='bg-destructive hover:bg-destructive/90'
                            >
                                Yes, Reset
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button
                            size='lg'
                            disabled={rankedItems.length !== totalCompaniesFromAPI || totalCompaniesFromAPI === 0} // Keep disabled logic on trigger
                            className={'bg-green-600 hover:bg-green-700'}
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
                            <AlertDialogAction
                                className={'bg-green-600 hover:bg-green-700'}
                                onClick={handleSubmit}
                            >
                                Yes, Submit
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Dialog for Submission Success Message */}
                <AlertDialog
                    open={isSubmitSuccessAlertOpen}
                    onOpenChange={setIsSubmitSuccessAlertOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Rankings Submitted!</AlertDialogTitle>
                            <AlertDialogDescription>
                                Your rankings have been successfully submitted. Thank you!
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction
                                className={'bg-green-600 hover:bg-green-700'}
                                onClick={() => setIsSubmitSuccessAlertOpen(false)}
                            >
                                OK
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

export default Ranking;
