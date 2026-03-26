import { authService } from '@services/firebase/auth-service';
import FirestoreInitService from '@services/firebase/firestore-init-service';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Admin Initialization Page
 * 
 * This page helps set up the database for first-time use.
 * Only accessible before any admin exists in the database.
 * 
 * Features:
 * - Initialize empty collections
 * - Create first admin user
 * - View database statistics
 * - Check collection status
 */

interface DBStats {
  timestamp: Date;
  collections: {
    name: string;
    documentCount: number;
    description: string;
  }[];
  totalDocuments: number;
}

export default function AdminInitPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [initialized, setInitialized] = useState(false);

  const handleInitializeDB = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await FirestoreInitService.initializeSampleData();
      
      if (result.success) {
        toast.success(result.message);
        setInitialized(true);
        await loadStats();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Use the proper authService to create admin user
      // This creates both Firebase Auth user AND Firestore document
      await authService.registerAdmin(email, password, name, 'super_admin');

      toast.success('Admin user created successfully!');
      setEmail('');
      setName('');
      setPassword('');
      await loadStats();
      
    } catch (error) {
      toast.error(`Failed to create admin: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const dbStats = await FirestoreInitService.getDatabaseStats();
      setStats(dbStats);
    } catch (error) {
      toast.error(`Failed to load stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  React.useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Database Admin Setup
          </h1>
          <p className="text-gray-600">
            Initialize your Firestore database and create the first admin user
          </p>
        </div>

        {/* Database Stats */}
        {stats && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Database Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalDocuments}
                </p>
              </div>
              {stats.collections.map((col) => (
                <div key={col.name} className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-gray-800 capitalize">
                    {col.name}
                  </p>
                  <p className="text-lg font-bold text-indigo-600">
                    {col.documentCount} docs
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{col.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Initialize Database */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              1. Initialize Collections
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Create empty collections in Firestore. Collections are created automatically
              when you add documents, but you can initialize them now.
            </p>
            <button
              type="button"
              onClick={handleInitializeDB}
              disabled={loading || initialized}
              className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                loading || initialized
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Initializing...' : initialized ? 'Initialized ✓' : 'Initialize Database'}
            </button>
            {initialized && (
              <p className="text-green-600 text-sm mt-2">✓ Collections ready</p>
            )}
          </div>

          {/* Create Admin */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              2. Create First Admin
            </h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Name
                </label>
                <input
                  id="admin-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password (min 8 chars)
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Creating...' : 'Create Admin User'}
              </button>
            </form>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-8 rounded">
          <h3 className="text-lg font-bold text-yellow-800 mb-2">
            ⚠️ Important Security Notes
          </h3>
          <ul className="list-disc list-inside space-y-2 text-yellow-700 text-sm">
            <li>This page should only be accessible during initial setup</li>
            <li>In production, use Firebase Authentication for secure registration</li>
            <li>Never store plain passwords in Firestore</li>
            <li>Enable Firestore security rules immediately after setup</li>
            <li>See FIRESTORE_SETUP.md for detailed configuration instructions</li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-6 rounded">
          <h3 className="text-lg font-bold text-blue-800 mb-2">
            Next Steps
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
            <li>Initialize collections (button above)</li>
            <li>Create your first admin user</li>
            <li>Deploy Firestore security rules: <code className="bg-white px-2 py-1 rounded">firebase deploy --only firestore:rules</code></li>
            <li>Login with admin credentials</li>
            <li>Add members and create events</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
