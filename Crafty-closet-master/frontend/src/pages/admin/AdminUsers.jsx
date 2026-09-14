// frontend/src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from 'react';
import { Search, ShieldCheck, ShieldOff, UserX, UserCheck } from 'lucide-react';
import { adminAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search;
      const { data } = await adminAPI.getUsers(params);
      setUsers(data.users || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const toggleActive = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u.id===id ? { ...u, is_active: u.is_active ? 0 : 1 } : u));
      toast.success('User status updated');
    } catch (err) { toast.error(err.message); }
  };

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      await adminAPI.updateUserRole(id, newRole);
      setUsers(prev => prev.map(u => u.id===id ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-rose-900">Users</h1>
        <p className="text-rose-400 text-sm">{users.length} registered users</p>
      </div>

      <div className="card p-4 mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300" />
          <input className="form-input pl-9 rounded-full text-sm" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Desktop Table (hidden on mobile) */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
            <table className="tbl w-full">
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Verified</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-rose-300 py-10">No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-rose-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {u.name[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm text-rose-800 flex items-center gap-1.5">
                            {u.name}
                            {u.id === me?.id && <span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full font-bold">You</span>}
                          </div>
                          <div className="text-xs text-rose-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${u.role==='admin'?'bg-purple-100 text-purple-700':'bg-rose-100 text-rose-600'}`}>
                        {u.role==='admin'&&<ShieldCheck size={11}/>} {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${u.is_active?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-600'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs font-medium ${u.email_verified?'text-emerald-600':'text-amber-500'}`}>
                        {u.email_verified ? '✓ Verified' : '⚠ Pending'}
                      </span>
                    </td>
                    <td className="text-rose-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                    </td>
                    <td>
                      {u.id !== me?.id && (
                        <div className="flex gap-1.5">
                          <button onClick={() => toggleActive(u.id)} title={u.is_active?'Disable':'Enable'}
                            className={`p-1.5 rounded-lg transition-colors ${u.is_active?'text-red-400 hover:text-red-600 hover:bg-red-50':'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                            {u.is_active ? <UserX size={15}/> : <UserCheck size={15}/>}
                          </button>
                          <button onClick={() => toggleRole(u.id, u.role)} title={u.role==='admin'?'Revoke admin':'Make admin'}
                            className={`p-1.5 rounded-lg transition-colors ${u.role==='admin'?'text-purple-400 hover:text-purple-600 hover:bg-purple-50':'text-blue-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                            {u.role==='admin' ? <ShieldOff size={15}/> : <ShieldCheck size={15}/>}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="card p-8 text-center text-rose-300">No users found</div>
        ) : users.map(u => (
          <div key={u.id} className="card p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              {u.avatar ? (
                <img src={u.avatar} alt={u.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-300 to-rose-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {u.name[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-rose-800 flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{u.name}</span>
                  {u.id === me?.id && <span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full font-bold shrink-0">You</span>}
                </div>
                <p className="text-xs text-rose-400 truncate">{u.email}</p>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role==='admin'?'bg-purple-100 text-purple-700':'bg-rose-100 text-rose-600'}`}>
                    {u.role==='admin'&&<ShieldCheck size={9}/>} {u.role}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-600'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 ${u.email_verified?'text-emerald-600':'text-amber-500'}`}>
                    {u.email_verified ? '✓ Verified' : '⚠ Pending'}
                  </span>
                </div>
              </div>
            </div>

            {u.id !== me?.id && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-rose-50">
                <span className="text-rose-400 text-xs">
                  Joined {new Date(u.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => toggleActive(u.id)} title={u.is_active?'Disable':'Enable'}
                    className={`p-2 rounded-lg transition-colors ${u.is_active?'text-red-400 hover:text-red-600 hover:bg-red-50':'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                    {u.is_active ? <UserX size={16}/> : <UserCheck size={16}/>}
                  </button>
                  <button onClick={() => toggleRole(u.id, u.role)} title={u.role==='admin'?'Revoke admin':'Make admin'}
                    className={`p-2 rounded-lg transition-colors ${u.role==='admin'?'text-purple-400 hover:text-purple-600 hover:bg-purple-50':'text-blue-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                    {u.role==='admin' ? <ShieldOff size={16}/> : <ShieldCheck size={16}/>}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
