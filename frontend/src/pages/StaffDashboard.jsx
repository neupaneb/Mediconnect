import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { tickets as ticketsApi, appointments as appointmentsApi } from '../api';
import Layout from '../components/Layout';
import TicketList from '../components/TicketList';
import AppointmentList from '../components/AppointmentList';
import StaffTicketDetail from '../components/StaffTicketDetail';
import UploadLabResult from '../components/UploadLabResult';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const TABS = [
  { id: 'tickets', label: 'Support Queue', icon: '📋' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'labs', label: 'Upload Labs', icon: '🔬' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
];

const CATEGORIES = {
  appointment_request: 'Appointment Request',
  billing_issue: 'Billing Issue',
  prescription_request: 'Prescription Request',
  general_inquiry: 'General Inquiry',
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('tickets');
  const [ticketList, setTicketList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filter, setFilter] = useState({ status: '', category: '' });

  const load = () => {
    ticketsApi.list(filter).then(setTicketList).catch(console.error);
    appointmentsApi.list().then(setAppointments).catch(console.error);
  };

  useEffect(load, [filter.status, filter.category]);

  return (
    <Layout
      title="Staff Dashboard"
      isStaff={true}
      tabs={TABS}
      activeTab={tab}
      onTabChange={(t) => { setTab(t); setSelectedTicket(null); }}
    >
      {tab === 'tickets' && (
        <>
          <div className="page-header">
            <h2>Support Queue</h2>
          </div>
          <div className="filters">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            >
              <option value="">All categories</option>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {selectedTicket ? (
            <StaffTicketDetail
              ticketId={selectedTicket}
              onClose={() => setSelectedTicket(null)}
              onUpdate={load}
            />
          ) : (
            <TicketList tickets={ticketList} onSelect={setSelectedTicket} staffView onUpdate={load} />
          )}
        </>
      )}

      {tab === 'appointments' && (
        <>
          <div className="page-header">
            <h2>Scheduled Appointments</h2>
          </div>
          <AppointmentList appointments={appointments} onUpdate={load} staffView />
        </>
      )}

      {tab === 'labs' && (
        <>
          <div className="page-header">
            <h2>Upload Lab Results</h2>
          </div>
          <UploadLabResult onClose={() => {}} onUploaded={() => {}} />
        </>
      )}

      {tab === 'analytics' && (
        <AnalyticsDashboard />
      )}
    </Layout>
  );
}
