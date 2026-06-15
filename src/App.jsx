import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <Input
        type="text"
        placeholder="Enter your name..."
        className="max-w-sm"
      />

      <Button>Submit</Button>
    </div>
  );
}

export default App;