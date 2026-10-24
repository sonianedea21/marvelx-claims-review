import { useParams } from 'react-router';

// Placeholder until slice 6.
export function ReviewPage() {
  const { id } = useParams();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Review {id}</h1>
    </main>
  );
}
