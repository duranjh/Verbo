import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { IconClose, IconEdit, IconChevronRight, IconArrowLeft, IconUser, IconShield, IconSparkles, IconLogOut, IconCreditCard, IconCheck, IconLock, IconClock } from './Icons';
import { VerboPlusModal } from './VerboPlusModal';
import { OccupationVerificationModal } from './OccupationVerificationModal';

interface AccountSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onLogout: () => void;
  onUpgradeToPlus: () => void;
  onManageSubscription: () => void;
}

type SidebarView = 'MAIN' | 'DETAILS' | 'SECURITY' | 'SUBSCRIPTION';

export const AccountSidebar: React.FC<AccountSidebarProps> = ({ 
    isOpen, onClose, user, onUpdateProfile, onLogout, onUpgradeToPlus, onManageSubscription 
}) => {
    const [currentView, setCurrentView] = useState<SidebarView>('MAIN');
    const [showPlusModal, setShowPlusModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);

    // Form States
    const [editFirstName, setEditFirstName] = useState(user.firstName);
    const [editLastName, setEditLastName] = useState(user.lastName);
    const [editUsername, setEditUsername] = useState(user.username);
    const [editDob, setEditDob] = useState(user.dob || '');
    const [editOccupation, setEditOccupation] = useState(user.occupation || '');
    const [editOccupationVisible, setEditOccupationVisible] = useState(user.isOccupationVisible ?? false);
    
    const [editEmail, setEditEmail] = useState(user.email);
    const [editPassword, setEditPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset view on close
    React.useEffect(() => {
        if (!isOpen) {
            setTimeout(() => setCurrentView('MAIN'), 300); // Reset after transition
        } else {
            // Sync state when opening
            setEditFirstName(user.firstName);
            setEditLastName(user.lastName);
            setEditUsername(user.username);
            setEditDob(user.dob || '');
            setEditOccupation(user.occupation || '');
            setEditOccupationVisible(user.isOccupationVisible ?? false);
            setEditEmail(user.email);
        }
    }, [isOpen, user]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                onUpdateProfile({ ...user, avatarUrl: event.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveDetails = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile({ 
            ...user, 
            firstName: editFirstName, 
            lastName: editLastName,
            username: editUsername, 
            dob: editDob, 
            occupation: editOccupation,
            isOccupationVisible: editOccupationVisible
        });
        setCurrentView('MAIN');
    };

    const handleSaveSecurity = (e: React.FormEvent) => {
        e.preventDefault();
        if (editPassword && editPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        onUpdateProfile({ ...user, email: editEmail });
        // In real app, handle password update API here
        setCurrentView('MAIN');
    };

    const handleVerboPlusClick = () => {
        if (user.isPremium) {
            setCurrentView('SUBSCRIPTION');
        } else {
            setShowPlusModal(true);
        }
    };

    const handleSubscribe = () => {
        onUpgradeToPlus();
        setShowPlusModal(false);
    };

    const handleOpenVerificationModal = () => {
        setShowVerificationModal(true);
    };

    const handleVerificationSubmit = (files: File[]) => {
        setShowVerificationModal(false);
        // Optimistically update profile to pending state
        onUpdateProfile({ 
            ...user, 
            isVerificationPending: true,
            isOccupationVerified: false 
        });
    };

    // Date of Birth Lock Logic
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
    const isDobLocked = user.dobLastUpdated ? (Date.now() - user.dobLastUpdated) < ONE_YEAR_MS : false;

    return (
        <>
            {showPlusModal && (
                <VerboPlusModal 
                    onClose={() => setShowPlusModal(false)} 
                    onSubscribe={handleSubscribe} 
                />
            )}

            {showVerificationModal && (
                <OccupationVerificationModal 
                    onClose={() => setShowVerificationModal(false)}
                    onSubmit={handleVerificationSubmit}
                />
            )}

            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" 
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    {currentView === 'MAIN' ? (
                        <>
                            <h2 className="font-bold text-xl text-slate-800">Account</h2>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                                <IconClose className="w-6 h-6" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setCurrentView('MAIN')} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors">
                                <IconArrowLeft className="w-5 h-5" /> Back
                            </button>
                            <h2 className="font-bold text-lg text-slate-800">
                                {currentView === 'DETAILS' && 'Account Details'}
                                {currentView === 'SECURITY' && 'Login & Security'}
                                {currentView === 'SUBSCRIPTION' && 'Manage Verbo+'}
                            </h2>
                            <div className="w-5"></div> {/* Spacer for centering */}
                        </>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                    
                    {/* MAIN VIEW */}
                    {currentView === 'MAIN' && (
                        <div className="p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Profile Header */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                    <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-md overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                                                <IconUser className="w-10 h-10" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-sm border-2 border-white hover:bg-indigo-700 transition-colors">
                                        <IconEdit className="w-3 h-3" />
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                
                                <h3 className="mt-4 text-xl font-bold text-slate-900">{user.firstName} {user.lastName}</h3>
                                <p className="text-slate-500 text-sm">@{user.username}</p>
                                {user.isPremium && (
                                    <span className="mt-2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                                        <IconSparkles className="w-3 h-3" /> Verbo+
                                    </span>
                                )}
                            </div>

                            {/* Menu Links */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100 mb-6">
                                <button onClick={() => setCurrentView('DETAILS')} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><IconUser className="w-5 h-5" /></div>
                                        <span className="font-bold text-sm text-slate-700">Account Details</span>
                                    </div>
                                    <IconChevronRight className="w-4 h-4 text-slate-400" />
                                </button>
                                
                                <button onClick={() => setCurrentView('SECURITY')} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"><IconShield className="w-5 h-5" /></div>
                                        <span className="font-bold text-sm text-slate-700">Login & Security</span>
                                    </div>
                                    <IconChevronRight className="w-4 h-4 text-slate-400" />
                                </button>

                                <button onClick={handleVerboPlusClick} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors"><IconSparkles className="w-5 h-5" /></div>
                                        <span className="font-bold text-sm text-slate-700">Verbo+</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!user.isPremium && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Try Free</span>}
                                        <IconChevronRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                </button>
                            </div>

                            <button onClick={onLogout} className="w-full p-4 rounded-xl border border-red-100 bg-white text-red-600 hover:bg-red-50 hover:border-red-200 transition-all font-bold text-sm flex items-center justify-center gap-2">
                                <IconLogOut className="w-4 h-4" /> Log Out
                            </button>
                        </div>
                    )}

                    {/* DETAILS VIEW */}
                    {currentView === 'DETAILS' && (
                        <form onSubmit={handleSaveDetails} className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                                        <input 
                                            type="text" 
                                            value={editFirstName}
                                            onChange={e => setEditFirstName(e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                                        <input 
                                            type="text" 
                                            value={editLastName}
                                            onChange={e => setEditLastName(e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                                    <input 
                                        type="text" 
                                        value={editUsername}
                                        onChange={e => setEditUsername(e.target.value)}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Must be unique.</p>
                                </div>
                                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Occupation</label>
                                        {user.isOccupationVerified ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                <IconCheck className="w-3 h-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-400">Unverified</span>
                                        )}
                                    </div>
                                    <input 
                                        type="text" 
                                        value={editOccupation}
                                        onChange={e => setEditOccupation(e.target.value)}
                                        placeholder="e.g. Student, Economist"
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all mb-4"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-600 font-medium">Display occupation in debates</span>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={editOccupationVisible}
                                            onClick={() => setEditOccupationVisible(!editOccupationVisible)}
                                            className={`${editOccupationVisible ? 'bg-indigo-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                                        >
                                            <span className={`${editOccupationVisible ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}/>
                                        </button>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        {user.isOccupationVerified ? (
                                            <button 
                                                type="button"
                                                disabled
                                                className="w-full py-2 bg-green-50 border border-green-100 text-green-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-default"
                                            >
                                                Occupation Verified
                                                <IconCheck className="w-3 h-3" />
                                            </button>
                                        ) : user.isVerificationPending ? (
                                            <button 
                                                type="button"
                                                disabled
                                                className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                                            >
                                                <IconClock className="w-3 h-3" />
                                                Proof Pending Review
                                            </button>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={user.isPremium ? handleOpenVerificationModal : undefined}
                                                disabled={!user.isPremium}
                                                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                                                    user.isPremium 
                                                    ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-sm' 
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                            >
                                                Submit Proof of Occupation
                                                <IconSparkles className={`w-3 h-3 ${user.isPremium ? 'text-yellow-400' : 'text-slate-400'}`} />
                                            </button>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                                            Verbo+ users receive a verified badge to increase credibility. Occupations must be verified once per year or after occupation updates.
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            value={editDob}
                                            onChange={e => setEditDob(e.target.value)}
                                            disabled={isDobLocked}
                                            className={`w-full p-3 border rounded-xl text-sm outline-none transition-all ${
                                                isDobLocked 
                                                ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' 
                                                : 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-100'
                                            }`}
                                        />
                                        {isDobLocked && <IconLock className="absolute right-3 top-3 w-4 h-4 text-slate-400" />}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {isDobLocked 
                                            ? `Date of birth is locked for security. You can update it again in ${Math.ceil((ONE_YEAR_MS - (Date.now() - (user.dobLastUpdated || 0))) / (1000 * 60 * 60 * 24))} days.`
                                            : "Date of birth may only be changed once per year."}
                                    </p>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                                Save Changes
                            </button>
                        </form>
                    )}

                    {/* SECURITY VIEW */}
                    {currentView === 'SECURITY' && (
                        <form onSubmit={handleSaveSecurity} className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={editEmail}
                                        onChange={e => setEditEmail(e.target.value)}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <h4 className="font-bold text-slate-800 mb-4 text-sm">Change Password</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                                            <input 
                                                type="password" 
                                                value={editPassword}
                                                onChange={e => setEditPassword(e.target.value)}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
                                            <input 
                                                type="password" 
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                                Update Security Settings
                            </button>
                        </form>
                    )}

                    {/* SUBSCRIPTION VIEW */}
                    {currentView === 'SUBSCRIPTION' && (
                        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <IconSparkles className="w-5 h-5 text-yellow-300" />
                                    <h3 className="font-bold text-lg">Verbo+ Active</h3>
                                </div>
                                <p className="text-indigo-100 text-sm">Your next billing date is <span className="font-bold text-white">October 24, 2025</span></p>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-4">
                                <h4 className="font-bold text-slate-800 text-sm mb-4">Payment Method</h4>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <IconCreditCard className="w-5 h-5 text-slate-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-700">Visa ending in 1234</p>
                                        <p className="text-xs text-slate-400">Expires 12/28</p>
                                    </div>
                                    <button className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors">
                                    View Billing History
                                </button>
                                <button onClick={onManageSubscription} className="w-full py-3 bg-white border border-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
                                    Cancel Subscription
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
};