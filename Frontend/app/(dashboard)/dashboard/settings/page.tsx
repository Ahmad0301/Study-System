"use client";

import { useState, useRef } from "react";
import {
  User,
  Shield,
  Save,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  Key,
  Laptop,
  Camera,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/lib/services/authService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const tabs = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "security", label: "Security & Password", icon: Shield },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || "Alex Johnson",
    email: user?.email || "alex@example.com",
    degree: "Computer Science Major",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Profile Picture State ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [removingPic, setRemovingPic] = useState(false);
  const [picError, setPicError] = useState("");

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);
  const [securityError, setSecurityError] = useState("");

  // ── Current avatar URL from persisted user data ──
  const currentPicUrl = user?.profilePicture
    ? user.profilePicture.startsWith("http")
      ? user.profilePicture
      : `${API_URL}/uploads/${user.profilePicture}`
    : null;
  const initial = user?.fullName?.[0]?.toUpperCase() || "A";

  // ── Profile Picture Handlers ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPicError("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/)) {
      setPicError("Only image files (jpg, jpeg, png, webp) are allowed.");
      return;
    }
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPicError("Image must be smaller than 2MB.");
      return;
    }

    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadPic = async () => {
    if (!previewFile) return;
    setUploadingPic(true);
    setPicError("");
    try {
      const result = await authService.uploadProfilePicture(previewFile);
      if (result.user) {
        updateUser({ profilePicture: result.user.profilePicture });
      }
      setPreviewFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      setPicError(err.message || "Failed to upload. Please try again.");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleRemovePic = async () => {
    setRemovingPic(true);
    setPicError("");
    try {
      await authService.removeProfilePicture();
      updateUser({ profilePicture: null });
    } catch (err: any) {
      setPicError(err.message || "Failed to remove. Please try again.");
    } finally {
      setRemovingPic(false);
    }
  };

  const cancelPreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
    setPicError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authService.updateProfile({
        name: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError("");

    if (!securityForm.currentPassword) {
      setSecurityError("Please enter your current password.");
      return;
    }
    if (securityForm.newPassword.length < 8) {
      setSecurityError("New password must be at least 8 characters.");
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setSecurityError("New passwords do not match.");
      return;
    }

    setSavingSecurity(true);
    try {
      await authService.changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      setSecuritySaved(true);
      setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setSecuritySaved(false), 3000);
    } catch (err: any) {
      setSecurityError(err.message || "Failed to change password. Please try again.");
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal profile, study preferences, and password security.
        </p>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-md border border-slate-200/60 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFILE SETTINGS */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Personal Information</h3>
                  <p className="text-xs text-slate-400">Update your name, email, and profile picture</p>
                </div>
              </div>
            </div>

            {/* ── Profile Picture Section ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar display */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-blue-500/20 shadow-md overflow-hidden">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : currentPicUrl ? (
                    <img src={currentPicUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                {/* Camera overlay button */}
                {!previewUrl && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md transition-colors"
                    title="Change picture"
                  >
                    <Camera size={14} />
                  </button>
                )}
              </div>

              {/* Info + actions */}
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{profileForm.fullName}</p>
                  <p className="text-xs text-slate-400">{profileForm.email}</p>
                </div>

                {/* Preview mode: show save/cancel */}
                {previewUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUploadPic}
                      disabled={uploadingPic}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {uploadingPic ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelPreview}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X size={12} />
                      Cancel
                    </button>
                  </div>
                )}

                {/* Normal mode: show change / remove buttons */}
                {!previewUrl && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Camera size={12} />
                      Change Picture
                    </button>
                    {currentPicUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePic}
                        disabled={removingPic}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {removingPic ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Remove
                      </button>
                    )}
                  </div>
                )}

                {/* Error message */}
                {picError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                    <AlertCircle size={14} />
                    <span>{picError}</span>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Degree / Major
              </label>
              <input
                type="text"
                value={profileForm.degree}
                onChange={(e) => setProfileForm((p) => ({ ...p, degree: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            {/* Save Action Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all"
              >
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{savingProfile ? "Saving Profile…" : "Save Profile Changes"}</span>
              </button>

              {profileSaved && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                  <CheckCircle2 size={16} />
                  <span>Profile updated successfully!</span>
                </div>
              )}
            </div>
          </div>
        </form>
      )}



      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Password Change Form */}
          <form onSubmit={handleSaveSecurity} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Password Security</h3>
                <p className="text-xs text-slate-400">Update your account password</p>
              </div>
            </div>

            {securityError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-medium">
                <AlertCircle size={16} />
                <span>{securityError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingSecurity}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 disabled:opacity-60 transition-all"
              >
                {savingSecurity ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                <span>{savingSecurity ? "Updating Password…" : "Update Password"}</span>
              </button>

              {securitySaved && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                  <CheckCircle2 size={16} />
                  <span>Password changed successfully!</span>
                </div>
              )}
            </div>
          </form>

          {/* Active Sessions Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Login Sessions</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Laptop size={20} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Windows PC · Chrome Browser</p>
                    <p className="text-[11px] text-slate-400">Current Session · Active Now</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
