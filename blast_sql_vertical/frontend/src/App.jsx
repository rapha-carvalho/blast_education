import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CoursePage from "./pages/CoursePage";
import LessonPage from "./pages/LessonPage";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CoursePage />} />
        <Route path="/lesson/:lessonId" element={<LessonPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
