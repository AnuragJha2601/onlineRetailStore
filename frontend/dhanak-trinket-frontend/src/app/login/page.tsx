'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const { login, googleLogin, isAdmin, isLoading } = useAuth();
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Redirect to admin if already logged in
    useEffect(() => {
        if (!isLoading && isAdmin) {
            window.location.href = '/admin';
        }
    }, [isAdmin, isLoading]);

    if (isLoading) return null;

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        const result = await login(username, password);
        if (result.success) {
            window.location.href = '/admin';
        } else {
            setError(result.error || 'Login failed');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
            <div className="max-w-sm w-full mx-auto px-4">
                {/* Branding */}
                <div className="flex flex-col items-center mb-8 gap-3">
                    <Image src="/logo.jpg" alt="Dhanak Trinket" width={80} height={80} className="rounded-full object-cover" priority />
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Dhanak Trinket</h1>
                        <p className="text-sm text-gray-500 mt-1">Ethnic Finds, Timeless Shine</p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Admin Login</h2>

                    <div className="flex flex-col items-center gap-4">
                        {submitting ? (
                            <p className="text-sm text-gray-500">Signing in...</p>
                        ) : (
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    if (!credentialResponse.credential) {
                                        setError('No credential received from Google');
                                        return;
                                    }
                                    setSubmitting(true);
                                    setError('');
                                    const result = await googleLogin(credentialResponse.credential);
                                    if (result.success) {
                                        window.location.href = '/admin';
                                    } else {
                                        setError(result.error || 'Login failed');
                                        setSubmitting(false);
                                    }
                                }}
                                onError={() => {
                                    setError('Google sign-in was cancelled or failed');
                                }}
                                theme="outline"
                                size="large"
                                width={280}
                                text="signin_with"
                            />
                        )}

                        {error && (
                            <div className="w-full bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Divider + password fallback */}
                        <div className="w-full pt-2">
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="w-full text-xs text-gray-400 hover:text-gray-600 text-center"
                            >
                                {showPassword ? 'Hide' : 'Use'} password login
                            </button>

                            {showPassword && (
                                <form onSubmit={handlePasswordLogin} className="mt-3 space-y-3">
                                    <div className="w-full border-t border-gray-200 mb-2" />
                                    <input
                                        type="text"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {submitting ? 'Signing in...' : 'Sign in'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-center mt-4">
                    <a href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
                        ← Back to catalog
                    </a>
                </p>
            </div>
        </div>
    );
}
