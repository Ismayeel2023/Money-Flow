import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';

export const UserProfileModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen } = useFinance();

  const [userName, setUserName] = useState('Mohamed Ismayeel');
  const [userEmail, setUserEmail] = useState('mohamedismayeel2005@gmail.com');
  const [userPhone, setUserPhone] = useState('+91 98765 43210');
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState('');

  if (!isProfileModalOpen) return null;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2500);
  };

  const handleSave = () => {
    setIsEditing(false);
    showNotification('Profile updated successfully');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-[#262626] relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px] material-symbols-fill">
                person
              </span>
            </div>
            <div>
              <h3 className="font-display font-bold text-[17px] text-[#FFFFFF]">
                User Profile
              </h3>
              <p className="font-body text-[12px] text-[#888888]">
                Account &amp; personal information
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsProfileModalOpen(false);
              setIsEditing(false);
            }}
            className="w-8 h-8 rounded-full bg-[#262626] text-[#888888] flex items-center justify-center hover:bg-[#333333] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex flex-col items-center text-center gap-2 pt-1">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] text-[#0F0F0F] flex items-center justify-center text-[34px] font-bold shadow-lg ring-4 ring-[#D4AF37]/20">
              <span className="material-symbols-outlined text-[38px] font-bold">person</span>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#10B981] border-2 border-[#1A1A1A] flex items-center justify-center" title="Active">
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-[19px] text-[#FFFFFF]">
              {userName}
            </h3>
            <p className="font-body text-[13px] text-[#888888]">{userEmail}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-[11px] font-bold tracking-wider uppercase border border-[#D4AF37]/30">
            Pro Member • Offline Sync
          </span>
        </div>

        {notification && (
          <div className="bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 text-[12px] font-bold py-2 px-3 rounded-xl text-center">
            {notification}
          </div>
        )}

        {/* Profile Fields */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">
              Personal Information
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-[12px] font-bold text-[#D4AF37] hover:underline"
            >
              {isEditing ? 'Cancel' : 'Edit Details'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] text-[#888888] block mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#3A3A3A] rounded-xl px-3 py-2 text-[#E0E0E0] text-[13px] focus:outline-none focus:border-[#D4AF37]"
                />
              ) : (
                <div className="text-[14px] font-semibold text-[#E0E0E0]">{userName}</div>
              )}
            </div>

            <div className="h-[1px] bg-[#2A2A2A]" />

            <div>
              <label className="text-[11px] text-[#888888] block mb-1">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-[#3A3A3A] rounded-xl px-3 py-2 text-[#E0E0E0] text-[13px] focus:outline-none focus:border-[#D4AF37]"
                />
              ) : (
                <div className="text-[14px] font-semibold text-[#E0E0E0]">{userEmail}</div>
              )}
            </div>

            <div className="h-[1px] bg-[#2A2A2A]" />

            <div>
              <label className="text-[11px] text-[#888888] block mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-[#181818] border border-[#3A3A3A] rounded-xl px-3 py-2 text-[#E0E0E0] text-[13px] focus:outline-none focus:border-[#D4AF37]"
                />
              ) : (
                <div className="text-[14px] font-semibold text-[#E0E0E0]">{userPhone}</div>
              )}
            </div>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={handleSave}
              className="w-full mt-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0F0F0F] font-bold text-[13px] py-2.5 rounded-xl transition-colors"
            >
              Save Profile
            </button>
          )}
        </div>

        {/* Member Meta */}
        <div className="bg-[#222222] rounded-2xl p-4 border border-[#2A2A2A] flex flex-col gap-2 text-[12px]">
          <div className="flex items-center justify-between text-[#888888]">
            <span>Account Type</span>
            <span className="font-semibold text-[#E0E0E0]">Personal Ledger</span>
          </div>
          <div className="flex items-center justify-between text-[#888888]">
            <span>Database Storage</span>
            <span className="font-semibold text-[#34D399]">Local Encrypted SQLite</span>
          </div>
          <div className="flex items-center justify-between text-[#888888]">
            <span>Client Platform</span>
            <span className="font-semibold text-[#E0E0E0]">Capacitor Android Native</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsProfileModalOpen(false);
            setIsEditing(false);
          }}
          className="w-full bg-[#262626] hover:bg-[#303030] text-[#FFFFFF] font-body font-bold text-[14px] py-3 rounded-2xl transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
};
