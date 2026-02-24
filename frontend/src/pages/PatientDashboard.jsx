import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { tickets as ticketsApi, appointments as appointmentsApi, labResults as labApi } from '../api';
import Layout from '../components/Layout';
import TicketList from '../components/TicketList';
import PatientTicketDetail from '../components/PatientTicketDetail';
import AppointmentList from '../components/AppointmentList';
import LabResultsList from '../components/LabResultsList';
import NewTicketModal from '../components/NewTicketModal';
import BookAppointment from '../components/BookAppointment';

const TABS = [
  { id: 'tickets', label: 'My Requests', icon: '📋' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'labs', label: 'Lab Results', icon: '🔬' },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('tickets');
  const [ticketList, setTicketList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [labs, setLabs] = useState([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showBook, setShowBook] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const load = () => {
    ticketsApi.list().then(setTicketList).catch(console.error);
    appointmentsApi.list().then(setAppointments).catch(console.error);
    labApi.list().then(setLabs).catch(console.error);
  };

  useEffect(load, []);

  return (
    <Layout
      title={`Welcome, ${user?.first_name || 'Patient'}`}
      isStaff={false}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      <div className="welcome-banner">
        <h2>Hello, {user?.first_name} {user?.last_name}</h2>
        <p>Manage your appointments, view lab results, and submit support requests.</p>
      </div>

      {tab === 'tickets' && (
        <>
          <div className="page-header">
            <h2>Support Requests</h2>
            <button className="btn btn-primary" onClick={() => setShowNewTicket(true)}>
              + New Request
            </button>
          </div>
          {selectedTicket ? (
            <PatientTicketDetail ticketId={selectedTicket} onClose={() => setSelectedTicket(null)} onUpdate={load} />
          ) : (
            <TicketList tickets={ticketList} onSelect={setSelectedTicket} onUpdate={load} patientView />
          )}
        </>
      )}

      {tab === 'appointments' && (
        <>
          <div className="page-header">
            <h2>Appointments</h2>
            <button className="btn btn-primary" onClick={() => setShowBook(true)}>
              + Book Appointment
            </button>
          </div>
          <AppointmentList appointments={appointments} onUpdate={load} patientView />
        </>
      )}

      {tab === 'labs' && (
        <>
          <div className="page-header">
            <h2>Lab Results</h2>
          </div>
          <LabResultsList results={labs} />
        </>
      )}

      {showNewTicket && <NewTicketModal onClose={() => setShowNewTicket(false)} onCreated={load} />}
      {showBook && <BookAppointment onClose={() => setShowBook(false)} onBooked={load} />}
    </Layout>
  );
}
