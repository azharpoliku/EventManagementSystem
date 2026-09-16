import { FormEvent, ReactNode, useState } from 'react'

const AUTH_KEY = 'eventManagement_auth'
const DEMO_USERNAME = 'admin'
const DEMO_PASSWORD = 'admin123'

type AuthState = { isAuthenticated: boolean; userId: string | null; username: string | null }
type EventRecord = { eventId: string; eventName: string; date: string; time: string; location: string; capacity: number; status: 'Draft' | 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' }
type Participant = { participantId: string; name: string; email: string; phone?: string; organisation?: string }
type Registration = { registrationId: string; eventId: string; participantId: string; registrationDate: string; status: 'Registered' | 'Cancelled' }
type Attendance = { attendanceId: string; eventId: string; participantId: string; status: 'Present' | 'Absent' }
type AppData = { events: EventRecord[]; participants: Participant[]; registrations: Registration[]; attendance: Attendance[] }

const loggedOut: AuthState = { isAuthenticated: false, userId: null, username: null }
const DATA_KEY = 'eventManagement_data'

const initialData: AppData = {
  events: [
    { eventId: 'event-1', eventName: 'Web Development Workshop', date: '2026-10-15', time: '09:00', location: 'Training Room A', capacity: 30, status: 'Upcoming' },
    { eventId: 'event-2', eventName: 'Community Networking Evening', date: '2026-11-02', time: '18:30', location: 'Main Hall', capacity: 60, status: 'Upcoming' },
  ],
  participants: [
    { participantId: 'participant-1', name: 'Aisha Rahman', email: 'aisha@example.com', phone: '012-3456789', organisation: 'Example University' },
    { participantId: 'participant-2', name: 'Daniel Lee', email: 'daniel@example.com', phone: '013-9876543', organisation: 'Community Group' },
  ],
  registrations: [
    { registrationId: 'registration-1', eventId: 'event-1', participantId: 'participant-1', registrationDate: '2026-09-15', status: 'Registered' },
    { registrationId: 'registration-2', eventId: 'event-1', participantId: 'participant-2', registrationDate: '2026-09-16', status: 'Registered' },
  ],
  attendance: [{ attendanceId: 'attendance-1', eventId: 'event-1', participantId: 'participant-1', status: 'Present' }],
}

function readData(): AppData {
  try {
    const saved = localStorage.getItem(DATA_KEY)
    if (saved) return JSON.parse(saved) as AppData
    localStorage.setItem(DATA_KEY, JSON.stringify(initialData))
  } catch { /* Fall back to seed data if storage is unavailable or invalid. */ }
  return initialData
}

function readAuth(): AuthState {
  try {
    const saved = localStorage.getItem(AUTH_KEY)
    return saved ? JSON.parse(saved) as AuthState : loggedOut
  } catch {
    return loggedOut
  }
}

export default function App() {
  const [auth, setAuth] = useState<AuthState>(readAuth)
  const [page, setPage] = useState<'dashboard' | 'events' | 'participants' | 'registrations' | 'attendance'>('dashboard')

  function login(username: string, password: string) {
    if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) return false
    const next = { isAuthenticated: true, userId: 'user-1', username: DEMO_USERNAME }
    localStorage.setItem(AUTH_KEY, JSON.stringify(next))
    setAuth(next)
    return true
  }

function logout() {
    localStorage.setItem(AUTH_KEY, JSON.stringify(loggedOut))
    setAuth(loggedOut)
  }

  return auth.isAuthenticated ? <AppShell username={auth.username ?? DEMO_USERNAME} page={page} setPage={setPage} onLogout={logout} /> : <Login onLogin={login} />
}

function AppShell({ username, page, setPage, onLogout }: { username: string; page: 'dashboard' | 'events' | 'participants' | 'registrations' | 'attendance'; setPage: (page: 'dashboard' | 'events' | 'participants' | 'registrations' | 'attendance') => void; onLogout: () => void }) {
  return <><nav className="main-nav"><button className={page === 'dashboard' ? 'nav-active' : ''} onClick={() => setPage('dashboard')}>Dashboard</button><button className={page === 'events' ? 'nav-active' : ''} onClick={() => setPage('events')}>Events</button><button className={page === 'participants' ? 'nav-active' : ''} onClick={() => setPage('participants')}>Participants</button><button className={page === 'registrations' ? 'nav-active' : ''} onClick={() => setPage('registrations')}>Registrations</button><button className={page === 'attendance' ? 'nav-active' : ''} onClick={() => setPage('attendance')}>Attendance</button></nav>{page === 'dashboard' ? <Dashboard username={username} onLogout={onLogout} /> : page === 'events' ? <EventsPage username={username} onLogout={onLogout} /> : page === 'participants' ? <ParticipantsPage username={username} onLogout={onLogout} /> : page === 'registrations' ? <RegistrationsPage username={username} onLogout={onLogout} /> : <AttendancePage username={username} onLogout={onLogout} />}</>
}

function Login({ onLogin }: { onLogin: (username: string, password: string) => boolean }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    setError(onLogin(username.trim(), password) ? '' : 'Invalid username or password.')
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={submit}>
    <p className="eyebrow">EVENT MANAGEMENT SYSTEM</p><h1>Welcome back</h1><p className="muted">Sign in to manage your events and participants.</p>
    <label htmlFor="username">Username</label><input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
    <label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
    {error && <p className="error" role="alert">{error}</p>}<button type="submit">Login</button>
    <p className="demo">Demo: <strong>admin</strong> / <strong>admin123</strong></p>
  </form></main>
}

function Dashboard({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [data, setData] = useState<AppData>(readData)
  const upcoming = data.events.filter((event) => event.status === 'Upcoming').sort((a, b) => a.date.localeCompare(b.date))
  const activeRegistrations = data.registrations.filter((registration) => registration.status === 'Registered')
  const presentCount = data.attendance.filter((record) => record.status === 'Present').length
  const attendanceRate = activeRegistrations.length ? Math.round((presentCount / activeRegistrations.length) * 100) : 0
  const recentRegistrations = [...activeRegistrations].sort((a, b) => b.registrationDate.localeCompare(a.registrationDate)).slice(0, 5)

  function saveData(next: AppData) {
    localStorage.setItem(DATA_KEY, JSON.stringify(next))
    setData(next)
  }

  function addEvent() {
    const nextEvent: EventRecord = { eventId: `event-${Date.now()}`, eventName: 'New Planning Session', date: '2026-12-10', time: '10:00', location: 'Meeting Room', capacity: 20, status: 'Upcoming' }
    saveData({ ...data, events: [...data.events, nextEvent] })
  }

  function addParticipant() {
    const nextParticipant: Participant = { participantId: `participant-${Date.now()}`, name: 'New Participant', email: `participant-${Date.now()}@example.com` }
    saveData({ ...data, participants: [...data.participants, nextParticipant] })
  }

  return <main className="app-page"><header><div><p className="eyebrow">EVENT MANAGEMENT SYSTEM</p><h1>Dashboard</h1></div><div className="user-area"><span>Signed in as {username}</span><button className="secondary" onClick={onLogout}>Logout</button></div></header>
    <section className="dashboard-intro"><h2>Good morning, {username}.</h2><p className="muted">Here is an overview of your event activity.</p></section>
    <section className="stat-grid" aria-label="Event statistics">
      <StatCard label="Total Events" value={data.events.length} />
      <StatCard label="Upcoming Events" value={upcoming.length} />
      <StatCard label="Total Participants" value={data.participants.length} />
      <StatCard label="Total Registrations" value={activeRegistrations.length} />
      <StatCard label="Attendance Rate" value={`${attendanceRate}%`} />
    </section>
    <section className="dashboard-grid"><DashboardPanel title="Upcoming Events"><div className="list">{upcoming.length ? upcoming.map((event) => <div className="list-row" key={event.eventId}><div><strong>{event.eventName}</strong><span>{event.date} · {event.location}</span></div><span className="status">{event.status}</span></div>) : <EmptyState text="No upcoming events yet." />}</div></DashboardPanel>
      <DashboardPanel title="Recent Registrations"><div className="list">{recentRegistrations.length ? recentRegistrations.map((registration) => { const participant = data.participants.find((item) => item.participantId === registration.participantId); const event = data.events.find((item) => item.eventId === registration.eventId); return <div className="list-row" key={registration.registrationId}><div><strong>{participant?.name ?? 'Unknown participant'}</strong><span>{event?.eventName ?? 'Unknown event'}</span></div><span className="date">{registration.registrationDate}</span></div> }) : <EmptyState text="No registrations yet." />}</div></DashboardPanel>
      <DashboardPanel title="Quick Actions"><div className="quick-actions"><button onClick={addEvent}>Add Event</button><button onClick={addParticipant}>Add Participant</button><button onClick={() => alert('Registration workflow will be available in the Registrations module.')}>Register Participant</button></div></DashboardPanel>
    </section></main>
}

function EventsPage({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [data, setData] = useState<AppData>(readData)
  const [editing, setEditing] = useState<EventRecord | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const statuses = ['All', 'Draft', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled']
  const events = data.events.filter((event) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [event.eventName, event.location].some((value) => value.toLowerCase().includes(query))
    return matchesSearch && (statusFilter === 'All' || event.status === statusFilter)
  }).sort((a, b) => sortDirection === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date))

  function saveEvent(event: EventRecord) { const next = { ...data, events: editing ? data.events.map((item) => item.eventId === event.eventId ? event : item) : [...data.events, event] }; localStorage.setItem(DATA_KEY, JSON.stringify(next)); setData(next); setShowForm(false); setEditing(null) }
  function deleteEvent(eventId: string) { if (!window.confirm('Delete this event and its registrations and attendance?')) return; const next = { ...data, events: data.events.filter((item) => item.eventId !== eventId), registrations: data.registrations.filter((item) => item.eventId !== eventId), attendance: data.attendance.filter((item) => item.eventId !== eventId) }; localStorage.setItem(DATA_KEY, JSON.stringify(next)); setData(next) }

  return <main className="app-page"><header><div><p className="eyebrow">EVENT MANAGEMENT SYSTEM</p><h1>Events</h1></div><div className="user-area"><span>Signed in as {username}</span><button className="secondary" onClick={onLogout}>Logout</button></div></header>
    <section className="page-intro"><div><h2>All events</h2><p className="muted">Search and manage the events saved in your browser.</p></div><button className="page-action" onClick={() => { setEditing(null); setShowForm(true) }}>Add Event</button></section>
    {showForm && <EventForm event={editing} onSave={saveEvent} onCancel={() => { setShowForm(false); setEditing(null) }} />}
    <section className="filters" aria-label="Event filters"><label htmlFor="event-search">Search events<input id="event-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or location" /></label><label htmlFor="status-filter">Status<select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><button className="secondary sort-button" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>Date: {sortDirection === 'asc' ? 'Oldest first' : 'Newest first'}</button></section>
    {events.length ? <section className="table-panel"><div className="table-wrap"><table><thead><tr><th>Event Name</th><th>Date</th><th>Time</th><th>Location</th><th>Capacity</th><th>Status</th><th>Registration Count</th><th>Actions</th></tr></thead><tbody>{events.map((event) => { const count = data.registrations.filter((registration) => registration.eventId === event.eventId && registration.status === 'Registered').length; return <tr key={event.eventId}><td data-label="Event Name"><strong>{event.eventName}</strong></td><td data-label="Date">{event.date}</td><td data-label="Time">{event.time}</td><td data-label="Location">{event.location}</td><td data-label="Capacity">{count} / {event.capacity}</td><td data-label="Status"><span className="status">{event.status}</span></td><td data-label="Registration Count">{count}</td><td data-label="Actions" className="row-actions"><button className="link-button" onClick={() => { setEditing(event); setShowForm(true) }}>Edit</button><button className="link-button danger" onClick={() => deleteEvent(event.eventId)}>Delete</button></td></tr> })}</tbody></table></div></section> : <section className="empty-card"><h2>No events found</h2><p className="muted">Try changing your search or status filter.</p></section>}
  </main>
}

function EventForm({ event, onSave, onCancel }: { event: EventRecord | null; onSave: (event: EventRecord) => void; onCancel: () => void }) { const [form, setForm] = useState<EventRecord>(event ?? { eventId: `event-${Date.now()}`, eventName: '', date: '', time: '', location: '', capacity: 1, status: 'Upcoming' }); const [error, setError] = useState(''); function submit(e: FormEvent) { e.preventDefault(); if (!form.eventName.trim() || !form.date || !form.time || !form.location.trim() || form.capacity <= 0) return setError('Name, date, time, location, and a positive capacity are required.'); onSave(form) } return <form className="crud-form" onSubmit={submit}><h2>{event ? 'Edit event' : 'Add event'}</h2><label>Event name<input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} /></label><label>Date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label><label>Time<input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></label><label>Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label><label>Capacity<input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></label><label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EventRecord['status'] })}>{['Draft', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select></label>{error && <p className="error feedback">{error}</p>}<div className="form-actions"><button type="submit">Save Event</button><button type="button" className="secondary" onClick={onCancel}>Cancel</button></div></form> }

function ParticipantsPage({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [data, setData] = useState<AppData>(readData)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Participant | null>(null)
  const [showForm, setShowForm] = useState(false)
  const participants = data.participants.filter((participant) => {
    const query = search.trim().toLowerCase()
    return !query || [participant.name, participant.email, participant.phone ?? '', participant.organisation ?? ''].some((value) => value.toLowerCase().includes(query))
  })
  function saveParticipant(participant: Participant) { const next = { ...data, participants: editing ? data.participants.map((item) => item.participantId === participant.participantId ? participant : item) : [...data.participants, participant] }; localStorage.setItem(DATA_KEY, JSON.stringify(next)); setData(next); setShowForm(false); setEditing(null) }
  function deleteParticipant(participantId: string) { if (!window.confirm('Delete this participant and their registrations and attendance?')) return; const next = { ...data, participants: data.participants.filter((item) => item.participantId !== participantId), registrations: data.registrations.filter((item) => item.participantId !== participantId), attendance: data.attendance.filter((item) => item.participantId !== participantId) }; localStorage.setItem(DATA_KEY, JSON.stringify(next)); setData(next) }

  return <main className="app-page"><header><div><p className="eyebrow">EVENT MANAGEMENT SYSTEM</p><h1>Participants</h1></div><div className="user-area"><span>Signed in as {username}</span><button className="secondary" onClick={onLogout}>Logout</button></div></header>
    <section className="page-intro"><div><h2>All participants</h2><p className="muted">Search and manage participants saved in your browser.</p></div><button className="page-action" onClick={() => { setEditing(null); setShowForm(true) }}>Add Participant</button></section>
    {showForm && <ParticipantForm participant={editing} existing={data.participants} onSave={saveParticipant} onCancel={() => { setShowForm(false); setEditing(null) }} />}
    <section className="filters participant-filters" aria-label="Participant filters"><label htmlFor="participant-search">Search participants<input id="participant-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email or organisation" /></label></section>
    {participants.length ? <section className="table-panel"><div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Organisation</th><th>Registration Count</th><th>Actions</th></tr></thead><tbody>{participants.map((participant) => { const count = data.registrations.filter((registration) => registration.participantId === participant.participantId && registration.status === 'Registered').length; return <tr key={participant.participantId}><td data-label="Name"><strong>{participant.name}</strong></td><td data-label="Email">{participant.email}</td><td data-label="Phone">{participant.phone ?? '—'}</td><td data-label="Organisation">{participant.organisation ?? '—'}</td><td data-label="Registration Count">{count}</td><td data-label="Actions" className="row-actions"><button className="link-button" onClick={() => { setEditing(participant); setShowForm(true) }}>Edit</button><button className="link-button danger" onClick={() => deleteParticipant(participant.participantId)}>Delete</button></td></tr> })}</tbody></table></div></section> : <section className="empty-card"><h2>No participants found</h2><p className="muted">Try changing your search.</p></section>}
  </main>
}

function ParticipantForm({ participant, existing, onSave, onCancel }: { participant: Participant | null; existing: Participant[]; onSave: (participant: Participant) => void; onCancel: () => void }) { const [form, setForm] = useState<Participant>(participant ?? { participantId: `participant-${Date.now()}`, name: '', email: '', phone: '', organisation: '' }); const [error, setError] = useState(''); function submit(e: FormEvent) { e.preventDefault(); if (!form.name.trim() || !form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return setError('Name and a valid email are required.'); if (existing.some((item) => item.email.toLowerCase() === form.email.toLowerCase() && item.participantId !== form.participantId)) return setError('A participant with this email already exists.'); onSave(form) } return <form className="crud-form" onSubmit={submit}><h2>{participant ? 'Edit participant' : 'Add participant'}</h2><label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Phone<input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>Organisation<input value={form.organisation ?? ''} onChange={(e) => setForm({ ...form, organisation: e.target.value })} /></label>{error && <p className="error feedback">{error}</p>}<div className="form-actions"><button type="submit">Save Participant</button><button type="button" className="secondary" onClick={onCancel}>Cancel</button></div></form> }

function RegistrationsPage({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [data, setData] = useState<AppData>(readData)
  const [eventId, setEventId] = useState('')
  const [participantId, setParticipantId] = useState('')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const activeRegistrations = data.registrations.filter((registration) => registration.status === 'Registered')

  function submit(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    const selectedEvent = data.events.find((item) => item.eventId === eventId)
    const selectedParticipant = data.participants.find((item) => item.participantId === participantId)
    if (!selectedEvent) return setMessage({ type: 'error', text: 'Please select an existing event.' })
    if (!selectedParticipant) return setMessage({ type: 'error', text: 'Please select an existing participant.' })
    const duplicate = activeRegistrations.some((registration) => registration.eventId === eventId && registration.participantId === participantId)
    if (duplicate) return setMessage({ type: 'error', text: 'This participant is already registered for the selected event.' })
    const eventRegistrationCount = activeRegistrations.filter((registration) => registration.eventId === eventId).length
    if (eventRegistrationCount >= selectedEvent.capacity) return setMessage({ type: 'error', text: 'Event capacity has been reached.' })
    const registration: Registration = { registrationId: `registration-${Date.now()}`, eventId, participantId, registrationDate: new Date().toISOString().slice(0, 10), status: 'Registered' }
    const next = { ...data, registrations: [...data.registrations, registration] }
    localStorage.setItem(DATA_KEY, JSON.stringify(next))
    setData(next)
    setMessage({ type: 'success', text: `${selectedParticipant.name} was registered successfully.` })
    setEventId('')
    setParticipantId('')
  }

  return <main className="app-page"><header><div><p className="eyebrow">EVENT MANAGEMENT SYSTEM</p><h1>Registrations</h1></div><div className="user-area"><span>Signed in as {username}</span><button className="secondary" onClick={onLogout}>Logout</button></div></header>
    <section className="page-intro"><h2>Register a participant</h2><p className="muted">Connect an existing participant to an existing event.</p></section>
    <form className="registration-form" onSubmit={submit}><label htmlFor="registration-event">Event<select id="registration-event" value={eventId} onChange={(item) => setEventId(item.target.value)}><option value="">Select an event</option>{data.events.map((item) => <option key={item.eventId} value={item.eventId}>{item.eventName} · {item.date}</option>)}</select></label><label htmlFor="registration-participant">Participant<select id="registration-participant" value={participantId} onChange={(item) => setParticipantId(item.target.value)}><option value="">Select a participant</option>{data.participants.map((item) => <option key={item.participantId} value={item.participantId}>{item.name} · {item.email}</option>)}</select></label><button type="submit">Create Registration</button></form>
    {message && <p className={message.type === 'error' ? 'error feedback' : 'success feedback'} role="status">{message.text}</p>}
    <section className="table-panel registration-list"><h2>Current registrations</h2>{activeRegistrations.length ? <div className="table-wrap"><table><thead><tr><th>Event</th><th>Participant</th><th>Registration Date</th></tr></thead><tbody>{activeRegistrations.map((registration) => <tr key={registration.registrationId}><td>{data.events.find((item) => item.eventId === registration.eventId)?.eventName ?? 'Unknown event'}</td><td>{data.participants.find((item) => item.participantId === registration.participantId)?.name ?? 'Unknown participant'}</td><td>{registration.registrationDate}</td></tr>)}</tbody></table></div> : <p className="empty-state">No registrations yet.</p>}</section>
  </main>
}

function AttendancePage({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [data, setData] = useState<AppData>(readData)
  const [eventId, setEventId] = useState('')
  const selectedEvent = data.events.find((event) => event.eventId === eventId)
  const registered = data.registrations.filter((registration) => registration.eventId === eventId && registration.status === 'Registered')
  const presentCount = registered.filter((registration) => data.attendance.some((record) => record.eventId === eventId && record.participantId === registration.participantId && record.status === 'Present')).length

  function updateAttendance(participantId: string, status: Attendance['status']) {
    const existing = data.attendance.find((record) => record.eventId === eventId && record.participantId === participantId)
    const nextAttendance = existing ? data.attendance.map((record) => record.attendanceId === existing.attendanceId ? { ...record, status } : record) : [...data.attendance, { attendanceId: `attendance-${Date.now()}`, eventId, participantId, status }]
    const next = { ...data, attendance: nextAttendance }
    localStorage.setItem(DATA_KEY, JSON.stringify(next))
    setData(next)
  }

  return <main className="app-page"><header><div><p className="eyebrow">EVENT MANAGEMENT SYSTEM</p><h1>Attendance</h1></div><div className="user-area"><span>Signed in as {username}</span><button className="secondary" onClick={onLogout}>Logout</button></div></header>
    <section className="page-intro"><h2>Mark attendance</h2><p className="muted">Only participants registered for the selected event are shown.</p></section>
    <section className="attendance-selector"><label htmlFor="attendance-event">Event<select id="attendance-event" value={eventId} onChange={(item) => setEventId(item.target.value)}><option value="">Select an event</option>{data.events.map((event) => <option key={event.eventId} value={event.eventId}>{event.eventName} · {event.date}</option>)}</select></label></section>
    {selectedEvent && <section className="attendance-summary"><div><span>Total registered</span><strong>{registered.length}</strong></div><div><span>Total present</span><strong>{presentCount}</strong></div><div><span>Total absent</span><strong>{registered.length - presentCount}</strong></div><div><span>Attendance rate</span><strong>{registered.length ? Math.round((presentCount / registered.length) * 100) : 0}%</strong></div></section>}
    {selectedEvent && (registered.length ? <section className="table-panel"><div className="table-wrap"><table><thead><tr><th>Participant</th><th>Email</th><th>Attendance</th></tr></thead><tbody>{registered.map((registration) => { const participant = data.participants.find((item) => item.participantId === registration.participantId); const status = data.attendance.find((record) => record.eventId === eventId && record.participantId === registration.participantId)?.status ?? 'Absent'; return <tr key={registration.registrationId}><td><strong>{participant?.name ?? 'Unknown participant'}</strong></td><td>{participant?.email ?? '—'}</td><td><select aria-label={`Attendance for ${participant?.name ?? 'participant'}`} value={status} onChange={(item) => updateAttendance(registration.participantId, item.target.value as Attendance['status'])}><option value="Present">Present</option><option value="Absent">Absent</option></select></td></tr> })}</tbody></table></div></section> : <section className="empty-card"><h2>No registered participants</h2><p className="muted">Register participants for this event before marking attendance.</p></section>)}
    {!selectedEvent && <section className="empty-card"><h2>Select an event</h2><p className="muted">Choose an event to view its registered participants.</p></section>}
  </main>
}

function StatCard({ label, value }: { label: string; value: string | number }) { return <article className="stat-card"><span>{label}</span><strong>{value}</strong></article> }
function DashboardPanel({ title, children }: { title: string; children: ReactNode }) { return <section className="panel"><h2>{title}</h2>{children}</section> }
function EmptyState({ text }: { text: string }) { return <p className="empty-state">{text}</p> }
