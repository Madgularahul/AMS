import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import ProfessionalSidebar from '../../components/ProfessionalSidebar';
import '../../components/ProfessionalSidebar.css';
import '../../components/ProfessionalLayout.css';

export default function AdminLayout() {
  return (
    <>
      <ProfessionalSidebar />
      <div className="professional-layout">
        <Navbar />
        <main className="professional-main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}