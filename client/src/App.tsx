import { Routes, Route } from "react-router";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Notebook from "./pages/Notebook";
import AuthInitializer from "./components/AuthInitializer";
import ThemeInitializer from "./components/ThemeInitializer";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <AuthInitializer />
      <ThemeInitializer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/notebook/:id?" 
          element={
            <ProtectedRoute>
              <Notebook />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default App;
