import { PlusCircle } from 'lucide-react';
import { Card, CardContent } from "../components/ui/card.jsx"; // Assuming .jsx extension is intended
import { Button } from "../components/ui/button.jsx";     // Assuming .jsx extension is intended

const JobActionCard = ({ onCreateClick }) => {
    return (
        <Card className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-gray-300 transition-all duration-300 ease-in-out bg-slate-50 shadow-none md:min-h-[250px]">
            <CardContent className="flex flex-col items-center justify-center text-center w-full p-0 align-middle"> {/* Note: 'align-middle' has no effect on a flex container; items-center and justify-center handle alignment here. */}
                <Button
                    onClick={onCreateClick}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md text-base leading-6 flex items-center justify-center"
                    aria-label="Create new job posting"
                >
                    <PlusCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <span className="inline-flex items-center bottom-2" >Create Job Posting</span>
                </Button>
                <p className="mt-3 text-xs sm:text-sm text-gray-500">
                    Have a new opportunity? Add it to the board.
                </p>
            </CardContent>
        </Card>
    );
};

export default JobActionCard;