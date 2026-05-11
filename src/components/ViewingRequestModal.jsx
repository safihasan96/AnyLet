import { useState } from 'react';
import { X, Calendar, Users, Briefcase, Mail, Phone, User } from 'lucide-react';
import Modal3D from './Modal3D';

export default function ViewingRequestModal({ isOpen, onClose, onSubmit, propertyTitle }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        profession: '',
        numberOfOccupants: 1,
        preferredDate: '',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Modal3D isOpen={isOpen} onClose={onClose} className="max-w-lg" zIndex={50}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Request Viewing</h2>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {propertyTitle}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className="overflow-y-auto p-6">
                    <form id="viewing-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#3E2B88] dark:text-[#a78bfa]">Personal Details</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput
                                    icon={<User size={18} />}
                                    label="Full Name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <FormInput
                                    icon={<Phone size={18} />}
                                    label="Phone Number"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <FormInput
                                icon={<Mail size={18} />}
                                label="Email Address"
                                type="email"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#3E2B88] dark:text-[#a78bfa]">Tenant Profile</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormInput
                                    icon={<Briefcase size={18} />}
                                    label="Profession"
                                    type="text"
                                    required
                                    value={formData.profession}
                                    onChange={e => setFormData({ ...formData, profession: e.target.value })}
                                    placeholder="e.g. Software Engineer"
                                />
                                <FormInput
                                    icon={<Users size={18} />}
                                    label="Occupants"
                                    type="number"
                                    min="1"
                                    required
                                    value={formData.numberOfOccupants}
                                    onChange={e => setFormData({ ...formData, numberOfOccupants: e.target.value })}
                                />
                            </div>

                            <FormInput
                                icon={<Calendar size={18} />}
                                label="Preferred Move-in Date"
                                type="date"
                                required
                                value={formData.preferredDate}
                                onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#3E2B88] dark:text-[#a78bfa]">Additional Note (Optional)</h3>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#3E2B88] focus-within:border-transparent transition-all">
                                <textarea
                                    rows="3"
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                                    placeholder="Hi, I am interested in viewing this property..."
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <button
                        type="submit"
                        form="viewing-form"
                        className="w-full bg-[#3E2B88] hover:bg-[#2d1e6b] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#3E2B88]/20 transition-all active:scale-95"
                    >
                        Submit Request
                    </button>
                </div>
            </div>
        </Modal3D>
    );
}

function FormInput({ icon, label, type, required, value, onChange, placeholder, min }) {
    return (
        <div className="space-y-1.5 flex-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-[#3E2B88] focus-within:border-transparent transition-all overflow-hidden group">
                <div className="text-slate-400 group-focus-within:text-[#3E2B88] transition-colors shrink-0">
                    {icon}
                </div>
                <input
                    type={type}
                    required={required}
                    value={value}
                    onChange={onChange}
                    min={min}
                    placeholder={placeholder}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 ml-2"
                />
            </div>
        </div>
    );
}
