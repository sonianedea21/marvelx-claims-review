import { Route, Routes } from 'react-router';
import { QueuePage } from './features/queue/QueuePage';
import { ReviewPage } from './features/review/ReviewPage';
import { DevComponentsPage } from './dev/DevComponentsPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<QueuePage />} />
      <Route path="/claims/:id" element={<ReviewPage />} />
      {import.meta.env.DEV && <Route path="/dev/components" element={<DevComponentsPage />} />}
    </Routes>
  );
}
