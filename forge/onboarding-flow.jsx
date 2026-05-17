/**
 * Forge Customer Onboarding Flow
 *
 * Complete onboarding experience:
 * 1. Sign up / Login
 * 2. Email verification
 * 3. Workspace creation
 * 4. Team member invites
 * 5. Plan selection
 * 6. Payment method
 * 7. Welcome & setup guide
 */

import React, { useState } from 'react';
import './onboarding.css';

// ============================================================================
// ONBOARDING STATE MACHINE
// ============================================================================

const ONBOARDING_STEPS = {
    SIGNUP: 'signup',
    EMAIL_VERIFICATION: 'email_verification',
    WORKSPACE_SETUP: 'workspace_setup',
    TEAM_INVITES: 'team_invites',
    PLAN_SELECTION: 'plan_selection',
    PAYMENT: 'payment',
    COMPLETE: 'complete'
};

// ============================================================================
// MAIN ONBOARDING CONTAINER
// ============================================================================

export function OnboardingFlow() {
    const [currentStep, setCurrentStep] = useState(ONBOARDING_STEPS.SIGNUP);
    const [userEmail, setUserEmail] = useState('');
    const [workspaceData, setWorkspaceData] = useState({});
    const [selectedPlan, setSelectedPlan] = useState('professional');

    const handleNext = (step, data = {}) => {
        if (data.email) setUserEmail(data.email);
        if (data.workspace) setWorkspaceData(data.workspace);
        if (data.plan) setSelectedPlan(data.plan);
        setCurrentStep(step);
    };

    const renderStep = () => {
        switch (currentStep) {
            case ONBOARDING_STEPS.SIGNUP:
                return <SignupStep onNext={handleNext} />;
            case ONBOARDING_STEPS.EMAIL_VERIFICATION:
                return <EmailVerificationStep email={userEmail} onNext={handleNext} />;
            case ONBOARDING_STEPS.WORKSPACE_SETUP:
                return <WorkspaceSetupStep onNext={handleNext} />;
            case ONBOARDING_STEPS.TEAM_INVITES:
                return <TeamInvitesStep onNext={handleNext} />;
            case ONBOARDING_STEPS.PLAN_SELECTION:
                return <PlanSelectionStep onNext={handleNext} />;
            case ONBOARDING_STEPS.PAYMENT:
                return <PaymentStep plan={selectedPlan} onNext={handleNext} />;
            case ONBOARDING_STEPS.COMPLETE:
                return <CompleteStep workspaceName={workspaceData.name} />;
            default:
                return <SignupStep onNext={handleNext} />;
        }
    };

    return (
        <div className="onboarding-container">
            <ProgressBar
                currentStep={currentStep}
                totalSteps={Object.keys(ONBOARDING_STEPS).length}
            />
            <div className="onboarding-content">
                {renderStep()}
            </div>
        </div>
    );
}

// ============================================================================
// STEP 1: SIGNUP
// ============================================================================

function SignupStep({ onNext }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            if (!response.ok) {
                const error = await response.json();
                setErrors(error.errors || { general: 'Signup failed' });
                return;
            }

            const data = await response.json();
            onNext(ONBOARDING_STEPS.EMAIL_VERIFICATION, { email });
        } catch (error) {
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-step">
            <div className="step-header">
                <h1>Welcome to Forge</h1>
                <p>Create your account to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="signup-form">
                <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="jane@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    {errors.password && <span className="error">{errors.password}</span>}
                </div>

                {errors.general && (
                    <div className="error-box">{errors.general}</div>
                )}

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <p className="step-footer">
                Already have an account? <a href="/login">Sign in</a>
            </p>
        </div>
    );
}

// ============================================================================
// STEP 2: EMAIL VERIFICATION
// ============================================================================

function EmailVerificationStep({ email, onNext }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });

            if (!response.ok) {
                setError('Invalid or expired code');
                return;
            }

            onNext(ONBOARDING_STEPS.WORKSPACE_SETUP);
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            setResendCooldown(60);
            const timer = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) clearInterval(timer);
                    return Math.max(0, prev - 1);
                });
            }, 1000);
        } catch (error) {
            setError('Failed to resend code');
        }
    };

    return (
        <div className="onboarding-step">
            <div className="step-header">
                <h1>Verify Your Email</h1>
                <p>We've sent a verification code to {email}</p>
            </div>

            <form onSubmit={handleVerify} className="verification-form">
                <div className="form-group">
                    <label htmlFor="code">Verification Code</label>
                    <input
                        id="code"
                        type="text"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength="6"
                        required
                        disabled={loading}
                        className="code-input"
                    />
                    {error && <span className="error">{error}</span>}
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Verifying...' : 'Verify Email'}
                </button>
            </form>

            <div className="resend-section">
                <p>Didn't receive the code?</p>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="btn-secondary"
                >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// STEP 3: WORKSPACE SETUP
// ============================================================================

function WorkspaceSetupStep({ onNext }) {
    const [workspaceName, setWorkspaceName] = useState('');
    const [industry, setIndustry] = useState('');
    const [teamSize, setTeamSize] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: workspaceName, industry, teamSize })
            });

            if (!response.ok) {
                setError('Failed to create workspace');
                return;
            }

            const workspace = await response.json();
            onNext(ONBOARDING_STEPS.TEAM_INVITES, { workspace });
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-step">
            <div className="step-header">
                <h1>Set Up Your Workspace</h1>
                <p>Tell us about your team</p>
            </div>

            <form onSubmit={handleSubmit} className="workspace-form">
                <div className="form-group">
                    <label htmlFor="workspace-name">Workspace Name</label>
                    <input
                        id="workspace-name"
                        type="text"
                        placeholder="Acme Corporation"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="industry">Industry</label>
                    <select
                        id="industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        required
                        disabled={loading}
                    >
                        <option value="">Select industry...</option>
                        <option value="tech">Technology</option>
                        <option value="finance">Finance</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="education">Education</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="team-size">Team Size</label>
                    <select
                        id="team-size"
                        value={teamSize}
                        onChange={(e) => setTeamSize(e.target.value)}
                        required
                        disabled={loading}
                    >
                        <option value="">Select team size...</option>
                        <option value="1-10">1-10 people</option>
                        <option value="10-50">10-50 people</option>
                        <option value="50-200">50-200 people</option>
                        <option value="200+">200+ people</option>
                    </select>
                </div>

                {error && <div className="error-box">{error}</div>}

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Creating Workspace...' : 'Create Workspace'}
                </button>
            </form>
        </div>
    );
}

// ============================================================================
// STEP 4: TEAM INVITES
// ============================================================================

function TeamInvitesStep({ onNext }) {
    const [members, setMembers] = useState(['']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addMember = () => {
        setMembers([...members, '']);
    };

    const removeMember = (index) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const updateMember = (index, value) => {
        const updated = [...members];
        updated[index] = value;
        setMembers(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const validEmails = members.filter((email) => email.trim().length > 0);

        try {
            if (validEmails.length > 0) {
                await fetch('/api/invitations/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emails: validEmails })
                });
            }

            onNext(ONBOARDING_STEPS.PLAN_SELECTION);
        } catch (err) {
            setError('Failed to send invitations');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-step">
            <div className="step-header">
                <h1>Invite Your Team</h1>
                <p>Add team members (optional)</p>
            </div>

            <form onSubmit={handleSubmit} className="invites-form">
                <div className="members-list">
                    {members.map((member, index) => (
                        <div key={index} className="member-input-group">
                            <input
                                type="email"
                                placeholder="team@company.com"
                                value={member}
                                onChange={(e) => updateMember(index, e.target.value)}
                                disabled={loading}
                            />
                            {members.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeMember(index)}
                                    className="btn-remove"
                                    disabled={loading}
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={addMember}
                    disabled={loading}
                    className="btn-secondary-small"
                >
                    + Add Another Member
                </button>

                {error && <div className="error-box">{error}</div>}

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Inviting...' : 'Continue to Plan Selection'}
                </button>
            </form>

            <p className="step-note">You can always invite more members later</p>
        </div>
    );
}

// ============================================================================
// STEP 5: PLAN SELECTION
// ============================================================================

function PlanSelectionStep({ onNext }) {
    const [selectedPlan, setSelectedPlan] = useState('professional');
    const [billing, setBilling] = useState('monthly');

    const plans = {
        professional: {
            name: 'Professional',
            monthlyPrice: 49,
            annualPrice: 490,
            features: [
                'Up to 50 team members',
                '500 GB storage',
                'Advanced analytics',
                'Email support',
                'Custom workflows'
            ]
        },
        enterprise: {
            name: 'Enterprise',
            monthlyPrice: 299,
            annualPrice: 2990,
            features: [
                'Unlimited team members',
                'Unlimited storage',
                'Advanced analytics',
                '24/7 phone support',
                'Custom integrations',
                'Dedicated account manager',
                'SSO & custom branding'
            ]
        }
    };

    return (
        <div className="onboarding-step">
            <div className="step-header">
                <h1>Choose Your Plan</h1>
                <p>Select the plan that works for you</p>
            </div>

            <div className="billing-toggle">
                <label>
                    <input
                        type="radio"
                        value="monthly"
                        checked={billing === 'monthly'}
                        onChange={(e) => setBilling(e.target.value)}
                    />
                    Monthly
                </label>
                <label>
                    <input
                        type="radio"
                        value="annual"
                        checked={billing === 'annual'}
                        onChange={(e) => setBilling(e.target.value)}
                    />
                    Annual (Save 17%)
                </label>
            </div>

            <div className="plans-grid">
                {Object.entries(plans).map(([key, plan]) => (
                    <div
                        key={key}
                        className={`plan-card ${selectedPlan === key ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan(key)}
                    >
                        <h3>{plan.name}</h3>
                        <div className="price">
                            ${billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
                            <span>/{billing === 'monthly' ? 'month' : 'year'}</span>
                        </div>
                        <ul className="features">
                            {plan.features.map((feature, i) => (
                                <li key={i}>✓ {feature}</li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            className={`btn-select ${selectedPlan === key ? 'selected' : ''}`}
                        >
                            {selectedPlan === key ? 'Selected' : 'Select Plan'}
                        </button>
                    </div>
                ))}
            </div>

            <div className="plan-actions">
                <button
                    className="btn-primary"
                    onClick={() => onNext(ONBOARDING_STEPS.PAYMENT, { plan: selectedPlan })}
                >
                    Continue to Payment
                </button>
                <button
                    className="btn-secondary"
                    onClick={() => onNext(ONBOARDING_STEPS.COMPLETE, { plan: 'free' })}
                >
                    Start with Free Plan
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// STEP 6: PAYMENT
// ============================================================================

function PaymentStep({ plan, onNext }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePayment = async () => {
        setLoading(true);
        setError('');

        try {
            // This would integrate with Stripe
            const response = await fetch('/api/billing/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
            });

            if (!response.ok) {
                setError('Payment failed. Please try again.');
                return;
            }

            onNext(ONBOARDING_STEPS.COMPLETE);
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-step">
            <div className="step-header">
                <h1>Add Payment Method</h1>
                <p>Your payment information is secure and encrypted</p>
            </div>

            {/* Stripe payment form would go here */}
            <div className="payment-form">
                <div className="form-group">
                    <label>Card Number</label>
                    <input placeholder="4242 4242 4242 4242" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Expiry Date</label>
                        <input placeholder="MM/YY" />
                    </div>
                    <div className="form-group">
                        <label>CVC</label>
                        <input placeholder="123" />
                    </div>
                </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
                onClick={handlePayment}
                disabled={loading}
                className="btn-primary"
            >
                {loading ? 'Processing...' : 'Complete Subscription'}
            </button>
        </div>
    );
}

// ============================================================================
// STEP 7: COMPLETE
// ============================================================================

function CompleteStep({ workspaceName }) {
    return (
        <div className="onboarding-step complete">
            <div className="success-icon">✓</div>
            <h1>Welcome to Forge!</h1>
            <p>Your workspace "{workspaceName}" is ready to go</p>

            <div className="next-steps">
                <h3>Next Steps:</h3>
                <ul>
                    <li>📚 <a href="/docs">Read the getting started guide</a></li>
                    <li>👥 <a href="/settings/team">Manage your team</a></li>
                    <li>⚙️ <a href="/settings">Customize your workspace</a></li>
                    <li>💬 <a href="/help">Get help from our support team</a></li>
                </ul>
            </div>

            <a href="/workspace" className="btn-primary">
                Go to Workspace
            </a>
        </div>
    );
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

function ProgressBar({ currentStep, totalSteps }) {
    const stepIndex = Object.values(ONBOARDING_STEPS).indexOf(currentStep);
    const progress = ((stepIndex + 1) / totalSteps) * 100;

    return (
        <div className="progress-bar-container">
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-text">
                Step {stepIndex + 1} of {totalSteps}
            </p>
        </div>
    );
}

export default OnboardingFlow;
