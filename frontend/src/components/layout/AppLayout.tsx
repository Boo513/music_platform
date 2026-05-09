import { Outlet } from 'react-router-dom';
import { PlayerBar } from './PlayerBar';

export function AppLayout() {
 return (
 <div className="min-h-screen">
 <Outlet />
 <PlayerBar />
 </div>
 );
}
