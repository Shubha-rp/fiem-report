import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-blue-600">
        Tailwind + shadcn/ui Working 
      </h1>

      <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <Input placeholder="Enter your name" />

        <Button className="w-full">
          Submit
        </Button>
      </div>
    </div>
  );
}

export default App;