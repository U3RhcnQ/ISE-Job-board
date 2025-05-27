import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const Login = () => {
    return (
        // This outer div centers the card vertically and horizontally on the page.
        // min-h-[80vh] gives it a minimum height to push the card down into the viewport.
        <div className="flex items-center justify-center min-h-[80vh] px-4">

            {/* This is the main Card component.
        - w-full and max-w-sm make it responsive.
        - The green border is added with Tailwind classes.
      */}
            <Card className="w-full max-w-sm border-2 border-green-500">
                <CardHeader className="text-center space-y-2">
                    {/* CardTitle and CardDescription for the header text */}
                    <CardTitle className="text-4xl font-black">[PETR]</CardTitle>
                    <CardDescription className="text-lg">Jobs Board</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4">
                        {/* Email Input Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email"
                                required
                            />
                        </div>

                        {/* Password Input Field */}
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="Password" required />
                        </div>

                        {/* This is the main Login Button.
              - We apply custom background colors to match your screenshot exactly.
              - text-white makes the font color white.
            */}
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white mt-2">
                            LOGIN
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    {/* The "Forgot Password?" link uses a Button with the "link" variant.
            This makes it look like a link but gives it the behavior of a button.
          */}
                    <Button asChild variant="link" className="text-sm">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;