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
import careTeamIllustration from '../assets/care-team.svg';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏥' },
  { id: 'tickets', label: 'My Requests', icon: '📋' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'labs', label: 'Lab Results', icon: '🔬' },
];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('home');
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

  const scheduledAppointments = appointments.filter((a) => a.status === 'scheduled');
  const openRequests = ticketList.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed');

  return (
    <Layout
      title={`Welcome, ${user?.first_name || 'Patient'}`}
      isStaff={false}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
    >
      {tab === 'home' && (
        <>
          <section className="patient-hero">
            <div className="patient-hero__copy">
              <div className="patient-hero__eyebrow">MediConnect Medical Center</div>
              <h2>Hello, {user?.first_name} {user?.last_name}</h2>
              <p>
                Care with clarity, support with trust. Manage appointments, track requests, and stay connected
                with your care team from one patient portal.
              </p>
              <div className="patient-hero__actions">
                <button className="hero-action-card" onClick={() => setTab('appointments')}>
                  <span className="hero-action-card__icon">📅</span>
                  <span>Make an Appointment</span>
                </button>
                <button className="hero-action-card" onClick={() => setTab('labs')}>
                  <span className="hero-action-card__icon">🔬</span>
                  <span>View Lab Results</span>
                </button>
                <button className="hero-action-card" onClick={() => setShowNewTicket(true)}>
                  <span className="hero-action-card__icon">💬</span>
                  <span>Contact Care Team</span>
                </button>
              </div>
            </div>
            <div className="patient-hero__art">
              <img src={careTeamIllustration} alt="Care team illustration" />
            </div>
          </section>

          <section className="patient-home-grid">
            <div className="patient-info-card">
              <h3>Welcome to MediConnect</h3>
              <p>
                MediConnect is a patient-focused healthcare platform that helps you manage appointments, lab
                results, prescriptions, and support requests in one place.
              </p>
            </div>
            <div className="patient-stat-card">
              <div className="patient-stat-card__value">{scheduledAppointments.length}</div>
              <div className="patient-stat-card__label">Scheduled Appointments</div>
            </div>
            <div className="patient-stat-card">
              <div className="patient-stat-card__value">{openRequests.length}</div>
              <div className="patient-stat-card__label">Open Support Requests</div>
            </div>
            <div className="patient-stat-card">
              <div className="patient-stat-card__value">{labs.length}</div>
              <div className="patient-stat-card__label">Lab Results Available</div>
            </div>
          </section>
        </>
      )}

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
