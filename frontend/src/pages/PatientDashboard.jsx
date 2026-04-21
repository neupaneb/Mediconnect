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
  { id: 'home', label: 'Home', icon: '🏥' },
  { id: 'tickets', label: 'My Requests', icon: '📋' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'labs', label: 'Lab Results', icon: '🔬' },
];

const careTeamIllustration =
  'https://www.oecd.org/adobe/dynamicmedia/deliver/dm-aid--757adc79-d680-43f0-96df-c9231a5318c2/shutterstock-2261501289.jpg?quality=80&preferwebp=true';

function formatDateLabel(value) {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
  const nextAppointment = [...scheduledAppointments]
    .filter((a) => new Date(`${a.appointment_date}T${a.start_time}`) >= new Date())
    .sort((a, b) => new Date(`${a.appointment_date}T${a.start_time}`) - new Date(`${b.appointment_date}T${b.start_time}`))[0];
  const recentTickets = [...ticketList]
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
    .slice(0, 3);
  const recentLabs = [...labs]
    .sort((a, b) => new Date(b.performed_at || 0) - new Date(a.performed_at || 0))
    .slice(0, 2);

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
              <div className="patient-info-card__meta">
                <span>Next step</span>
                <strong>{nextAppointment ? 'Review your upcoming visit' : 'Book your next appointment'}</strong>
              </div>
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

          <section className="patient-overview-grid">
            <div className="patient-panel patient-panel--highlight">
              <div className="patient-panel__header">
                <div>
                  <div className="patient-panel__eyebrow">Your Care Snapshot</div>
                  <h3>Upcoming Appointment</h3>
                </div>
                <button className="btn btn-secondary btn-small" onClick={() => setShowBook(true)}>
                  {nextAppointment ? 'Book Another' : 'Book Now'}
                </button>
              </div>
              {nextAppointment ? (
                <div className="patient-next-appointment">
                  <div className="patient-next-appointment__date">
                    <span>{formatDateLabel(nextAppointment.appointment_date)}</span>
                    <strong>{nextAppointment.start_time} - {nextAppointment.end_time}</strong>
                  </div>
                  <div className="patient-next-appointment__details">
                    <div>
                      <span className="patient-panel__label">Visit Type</span>
                      <strong>{nextAppointment.intake?.visit_type?.replace('_', ' ') || 'Primary care'}</strong>
                    </div>
                    <div>
                      <span className="patient-panel__label">Status</span>
                      <strong>{nextAppointment.status}</strong>
                    </div>
                  </div>
                  {nextAppointment.notes && (
                    <p className="patient-next-appointment__notes">{nextAppointment.notes}</p>
                  )}
                </div>
              ) : (
                <div className="patient-empty-state">
                  <p>No upcoming appointment is scheduled yet.</p>
                  <span>Use the AI assistant or manual booking flow to reserve your next visit.</span>
                </div>
              )}
            </div>

            <div className="patient-panel">
              <div className="patient-panel__header">
                <div>
                  <div className="patient-panel__eyebrow">Support Activity</div>
                  <h3>Recent Requests</h3>
                </div>
                <button className="btn btn-secondary btn-small" onClick={() => setShowNewTicket(true)}>
                  New Request
                </button>
              </div>
              {recentTickets.length ? (
                <div className="patient-mini-list">
                  {recentTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      className="patient-mini-list__item"
                      onClick={() => {
                        setTab('tickets');
                        setSelectedTicket(ticket.id);
                      }}
                    >
                      <div>
                        <strong>{ticket.subject}</strong>
                        <span>{ticket.department || 'Primary Care'} • {ticket.status}</span>
                      </div>
                      <em>{formatDateLabel(ticket.updated_at || ticket.created_at)}</em>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="patient-empty-state">
                  <p>No requests yet.</p>
                  <span>Questions about billing, prescriptions, or general care can start here.</span>
                </div>
              )}
            </div>

            <div className="patient-panel">
              <div className="patient-panel__header">
                <div>
                  <div className="patient-panel__eyebrow">Clinical Updates</div>
                  <h3>Latest Lab Results</h3>
                </div>
                <button className="btn btn-secondary btn-small" onClick={() => setTab('labs')}>
                  View All
                </button>
              </div>
              {recentLabs.length ? (
                <div className="patient-mini-list">
                  {recentLabs.map((lab) => (
                    <button
                      key={lab.id}
                      type="button"
                      className="patient-mini-list__item"
                      onClick={() => setTab('labs')}
                    >
                      <div>
                        <strong>{lab.test_type}</strong>
                        <span>{lab.result_value ?? 'Pending'} {lab.unit || ''}</span>
                      </div>
                      <em>{formatDateLabel(lab.performed_at)}</em>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="patient-empty-state">
                  <p>No lab results posted yet.</p>
                  <span>As soon as your care team publishes them, they’ll appear here.</span>
                </div>
              )}
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
