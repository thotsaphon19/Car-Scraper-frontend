import dynamic from 'next/dynamic';
const App = dynamic(() => import('@/components/App'), { ssr: false, loading: () => null });
export default function Page() { return <App />; }
