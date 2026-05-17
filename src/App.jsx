import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Task Manager</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-sm text-slate-400 hover:text-white w-full text-center"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  )
}

function ProjectManager({ onClose }) {
  const [projects, setProjects] = useState([])
  const [newName, setNewName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*, tasks(count)')
      .order('sort_order')
      .order('name')
    setProjects(data || [])
  }

  const addProject = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    await supabase.from('projects').insert({ name: newName.trim() })
    setNewName('')
    fetchProjects()
  }

  const toggleArchive = async (project) => {
    await supabase
      .from('projects')
      .update({ is_active: !project.is_active })
      .eq('id', project.id)
    fetchProjects()
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h1 className="text-lg font-semibold">Projects</h1>
        <button onClick={onClose} className="text-blue-400 hover:text-blue-300">Done</button>
      </header>
      <div className="p-4 max-w-lg mx-auto space-y-4">
        <form onSubmit={addProject} className="flex gap-2">
          <input
            type="text"
            placeholder="New project name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Add</button>
        </form>
        {projects.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
            <div>
              <p className={p.is_active ? 'font-medium' : 'font-medium text-slate-500 line-through'}>{p.name}</p>
              <p className="text-xs text-slate-400">{p.tasks?.[0]?.count || 0} tasks</p>
            </div>
            <button
              onClick={() => toggleArchive(p)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              {p.is_active ? 'Archive' : 'Restore'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddTask({ onAdd }) {
  const [title, setTitle] = useState('')
  const [open, setOpen] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const { error } = await supabase.from('tasks').insert({ title: title.trim() })
    if (!error) {
      setTitle('')
      setOpen(false)
      onAdd()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 border border-dashed border-slate-600 rounded text-slate-400 hover:text-white hover:border-slate-400"
      >
        + Add task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        autoFocus
        type="text"
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none"
      />
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Add
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-400 hover:text-white">
        ✕
      </button>
    </form>
  )
}

function TaskDetail({ task, onBack, onUpdate }) {
  const [form, setForm] = useState({
    title: task.title,
    status: task.status,
    context: task.context || '',
    queue: task.queue || '',
    review_date: task.review_date || '',
    due_date: task.due_date || '',
    link: task.link || '',
    project_id: task.project_id || '',
    notes: task.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setProjects(data || []))
  }, [])

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    const updates = {
      ...form,
      context: form.context || null,
      queue: form.queue || null,
      project_id: form.project_id || null,
      review_date: form.review_date || null,
      due_date: form.due_date || null,
      link: form.link || null,
      notes: form.notes || null,
    }
    await supabase.from('tasks').update(updates).eq('id', task.id)
    setSaving(false)
    onUpdate()
    onBack()
  }

  const handleComplete = async () => {
    await supabase
      .from('tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', task.id)
    onUpdate()
    onBack()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', task.id)
    onUpdate()
    onBack()
  }

  const labelClass = 'block text-sm text-slate-400 mb-1'
  const inputClass =
    'w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:border-blue-500 focus:outline-none'

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <button onClick={onBack} className="text-blue-400 hover:text-blue-300">
          ← Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </header>
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="waiting_for">Waiting For</option>
              <option value="someday">Someday</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Context</label>
            <select
              value={form.context}
              onChange={(e) => handleChange('context', e.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="errand">Errand</option>
              <option value="phone">Phone</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Review Date</label>
            <input
              type="date"
              value={form.review_date}
              onChange={(e) => handleChange('review_date', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Due Date</label>
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Project</label>
          <select
            value={form.project_id}
            onChange={(e) => handleChange('project_id', e.target.value)}
            className={inputClass}
          >
            <option value="">Inbox (no project)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Queue</label>
          <input
            type="text"
            value={form.queue}
            onChange={(e) => handleChange('queue', e.target.value)}
            placeholder="e.g. SLG, GitLab"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Link</label>
          <input
            type="url"
            value={form.link}
            onChange={(e) => handleChange('link', e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={5}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-700">
          {task.status !== 'completed' && (
            <button
              onClick={handleComplete}
              className="flex-1 py-2 bg-green-700 rounded hover:bg-green-600"
            >
              ✓ Complete
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex-1 py-2 bg-red-900 rounded hover:bg-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskList() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterContext, setFilterContext] = useState('')
  const [filterQueue, setFilterQueue] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [allProjects, setAllProjects] = useState([])
  const [sortBy, setSortBy] = useState('review_date')
  const [showProjects, setShowProjects] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [filterStatus, filterContext, filterQueue, filterProject, sortBy])

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setAllProjects(data || []))
  }, [])

  const fetchTasks = async () => {
    let query = supabase
      .from('tasks')
      .select('*, projects(name)')
      if (sortBy === 'review_date') {
      query = query.order('review_date', { ascending: true, nullsFirst: false }).order('created_at')
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'project') {
      query = query.order('project_id').order('review_date', { ascending: true, nullsFirst: false })
    }

    if (filterStatus === 'all') {
      query = query.in('status', ['active', 'waiting_for'])
    } else {
      query = query.eq('status', filterStatus)
    }
    if (filterContext) query = query.eq('context', filterContext)
    if (filterQueue) query = query.eq('queue', filterQueue)
    if (filterProject === 'inbox') query = query.is('project_id', null)
    else if (filterProject) query = query.eq('project_id', filterProject)

    const { data } = await query
    setTasks(data || [])
    setLoading(false)
  }

  if (showProjects) {
    return <ProjectManager onClose={() => { setShowProjects(false); fetchTasks() }} />
  }
  if (selectedTask) {
    return (
      <TaskDetail
        task={selectedTask}
        onBack={() => setSelectedTask(null)}
        onUpdate={fetchTasks}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <h1 className="text-lg font-semibold">Tasks</h1>
        <button
          onClick={() => setShowProjects(true)}
          className="text-sm text-slate-400 hover:text-white"
        >
          Projects
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-slate-400 hover:text-white"
        >
          Sign out
        </button>
      </header>
      <main className="p-4 max-w-lg mx-auto">
        <AddTask onAdd={fetchTasks} />
        <div className="mt-3 flex flex-wrap gap-2">
          {['all', 'active', 'waiting_for', 'someday', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s === 'all' ? 'All Active' : s === 'waiting_for' ? 'Waiting' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 text-sm text-slate-300 rounded border border-slate-700 focus:outline-none"
          >
            <option value="review_date">By review date</option>
            <option value="created_at">By date added</option>
            <option value="project">By project</option>
          </select>
          <select
            value={filterContext}
            onChange={(e) => setFilterContext(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 text-sm text-slate-300 rounded border border-slate-700 focus:outline-none"
          >
            <option value="">All contexts</option>
            <option value="home">Home</option>
            <option value="work">Work</option>
            <option value="errand">Errand</option>
            <option value="phone">Phone</option>
          </select>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 text-sm text-slate-300 rounded border border-slate-700 focus:outline-none"
          >
            <option value="">All projects</option>
            <option value="inbox">Inbox</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterQueue}
            onChange={(e) => setFilterQueue(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 text-sm text-slate-300 rounded border border-slate-700 focus:outline-none"
          >
            <option value="">All queues</option>
            {[...new Set(tasks.map((t) => t.queue).filter(Boolean))].sort().map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          {loading ? (
            <p className="text-slate-400">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-slate-400">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="p-3 bg-slate-800 rounded border border-slate-700"
                >
                  <div
                    onClick={() => setSelectedTask(task)}
                    className="cursor-pointer active:bg-slate-700"
                  >
                    <p className="font-medium">{task.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-400">
                      {task.context && <span className="bg-slate-700 px-2 py-0.5 rounded">{task.context}</span>}
                      {task.queue && <span className="bg-slate-700 px-2 py-0.5 rounded">{task.queue}</span>}
                      {task.status === 'waiting_for' && (
                        <span className="bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded">waiting</span>
                      )}
                      {task.projects?.name && <span className="text-slate-500">{task.projects.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <span className="text-slate-500">📅</span>
                    <input
                      type="date"
                      value={task.review_date || ''}
                      onChange={async (e) => {
                        const val = e.target.value || null
                        await supabase.from('tasks').update({ review_date: val }).eq('id', task.id)
                        fetchTasks()
                      }}
                      className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null
  return session ? <TaskList /> : <Auth />
}