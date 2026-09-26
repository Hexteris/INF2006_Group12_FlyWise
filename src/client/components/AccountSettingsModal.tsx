import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FOCUS_VISIBLE, BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_DANGER } from '../styles';

// Professional SVG icon components
const Icons = {
  User: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Email: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Check: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Trash: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Close: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, deleteAccount, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Update form data when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError();
    setIsUpdateSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsUpdateSuccess(true);
    } catch (err) {
      // Error is handled by auth context
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText === 'DELETE') {
      try {
        await deleteAccount();
        onClose();
      } catch (err) {
        // Error is handled by auth context
      }
    }
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Modal overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/95 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-surface border border-line/50 rounded-xl shadow-xl">
          {/* Modal header */}
          <div className="flex items-center justify-between p-6 border-b border-line/50">
            <div>
              <h2 className="text-xl font-bold text-ink">Account Settings</h2>
              <p className="text-sm text-ink-dim mt-1">Manage your profile and account</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${FOCUS_VISIBLE} hover:bg-surface-raised active:scale-95`}
              aria-label="Close modal"
            >
              <Icons.Close className="w-5 h-5 text-ink-dim" />
            </button>
          </div>

          {/* Modal content */}
          <div className="p-6">
            {isUpdateSuccess && (
              <div className="mb-4 p-3 bg-good/10 border border-good/30 rounded-lg flex items-center gap-2">
                <Icons.Check className="w-4 h-4 text-good" />
                <span className="text-sm text-good font-medium">Profile updated successfully</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-bad/10 border border-bad/30 rounded-lg">
                <span className="text-sm text-bad font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-ink mb-1">
                  Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.User className="w-4 h-4 text-ink-dim" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-surface border border-line/50 rounded-lg focus:border-amber focus:ring-1 focus:ring-amber transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-ink mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Email className="w-4 h-4 text-ink-dim" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-surface border border-line/50 rounded-lg focus:border-amber focus:ring-1 focus:ring-amber transition-colors"
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className={`${BUTTON_PRIMARY} flex-1 justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`${BUTTON_SECONDARY} flex-1 justify-center`}
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Account deletion section */}
            <div className="mt-8 pt-6 border-t border-line/50">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-bad mb-1">Danger Zone</h3>
                <p className="text-xs text-ink-dim">
                  Deleting your account will permanently remove all your data. This action cannot be undone.
                </p>
              </div>

              {!isDeleteConfirmOpen ? (
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className={`${BUTTON_DANGER} w-full justify-center`}
                >
                  <Icons.Trash className="w-4 h-4" />
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-bad/5 border border-bad/20 rounded-lg">
                    <p className="text-xs text-bad font-semibold mb-2">⚠️ Confirm Account Deletion</p>
                    <p className="text-xs text-ink-dim mb-3">
                      This will permanently delete your account and all associated data. Type "DELETE" below to confirm.
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-surface border border-bad/30 rounded-lg focus:border-bad focus:ring-1 focus:ring-bad transition-colors"
                      placeholder="Type DELETE to confirm"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || loading}
                      className={`${BUTTON_DANGER} flex-1 justify-center ${deleteConfirmText !== 'DELETE' || loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>Deleting...</span>
                        </div>
                      ) : (
                        <>
                          <Icons.Trash className="w-4 h-4" />
                          Delete Account
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        setDeleteConfirmText('');
                      }}
                      className={`${BUTTON_SECONDARY} flex-1 justify-center`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountSettingsModal;