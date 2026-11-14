import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  Shield, 
  Mail, 
  MoreVertical, 
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { translations } from '../translations';
import { Language, User } from '../types';
import { cn } from '../lib/utils';

interface UsersProps {
  lang: Language;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

export const Users: React.FC<UsersProps> = ({ lang, users, onUpdateUsers }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    password: '',
    role: 'Content Creator',
    permissions: ['view']
  });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Content Creator',
        permissions: ['view']
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const cleanFormData = {
      ...formData,
      name: (formData.name || '').trim(),
      email: (formData.email || '').trim().toLowerCase(),
      password: (formData.password || '').trim()
    };
    if (editingUser) {
      onUpdateUsers(users.map(u => u.id === editingUser.id ? { ...u, ...cleanFormData } as User : u));
    } else {
      const newUser: User = {
        ...cleanFormData,
        id: Math.random().toString(36).substr(2, 9),
        avatar: cleanFormData.name?.[0]?.toUpperCase() || '?',
      } as User;
      onUpdateUsers([...users, newUser]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(isRtl ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure you want to delete this user?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t.users}</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
        >
          <UserPlus size={18} />
          {t.addUser}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Roles Breakdown</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Admin: {users.filter(u => u.role === 'Admin').length}</span>
            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Creator: {users.filter(u => u.role === 'Content Creator').length}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">System Status</p>
          <p className="text-2xl font-bold text-green-600">Active</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 text-gray-400", isRtl ? "right-3" : "left-3")} size={18} />
            <input 
              type="text" 
              placeholder={isRtl ? "بحث عن مستخدم..." : "Search users..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm",
                isRtl ? "pr-10 pl-4" : "pl-10 pr-4"
              )}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={cn("bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider", isRtl && "text-right")}>
                <th className="px-6 py-4">{isRtl ? 'المستخدم' : 'User'}</th>
                <th className="px-6 py-4">{t.role}</th>
                <th className="px-6 py-4">{t.permissions}</th>
                <th className="px-6 py-4 text-right">{isRtl ? 'خيارات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 border-2 border-white shadow-sm">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.map(p => (
                        <span key={p} className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 space-y-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingUser ? (isRtl ? 'تعديل مستخدم' : 'Edit User') : (isRtl ? 'إضافة مستخدم جديد' : 'Add New User')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{isRtl ? 'الاسم' : 'Name'}</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{isRtl ? 'كلمة المرور' : 'Password'}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{isRtl ? 'الدور' : 'Role'}</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all"
                >
                  <option value="Admin">Admin</option>
                  <option value="Content Manager">Content Manager</option>
                  <option value="Content Creator">Content Creator</option>
                  <option value="Designer">Designer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">{isRtl ? 'الصلاحيات' : 'Permissions'}</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['all', 'create', 'edit', 'approve', 'view'].map(p => (
                    <button 
                      key={p}
                      onClick={() => {
                        const permissions = formData.permissions || [];
                        if (permissions.includes(p)) {
                          setFormData({...formData, permissions: permissions.filter(x => x !== p)});
                        } else {
                          setFormData({...formData, permissions: [...permissions, p]});
                        }
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all",
                        formData.permissions?.includes(p) ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
              >
                {t.save}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
