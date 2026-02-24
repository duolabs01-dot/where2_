
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../supabase';
import { PrimaryButton } from './Layouts';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { InviteCodeInput } from './InviteCodeInput';
import { EmailVerification } from './EmailVerification';
import { showToast } from '../utils/toast';
import { formatSupabaseError } from '../utils/errorHelper';
import { useTheme } from './ThemeProvider';

// --- Validation Schema ---
const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Needs an uppercase letter')
    .regex(/[a-z]/, 'Needs a lowercase letter')
    .regex(/[0-9]/, 'Needs a number')
    .regex(/[^A-Za-z0-9]/, 'Needs a special character'),
  confirmPassword: z.string(),
  inviteCode: z.string().optional(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to terms'
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess: () => void;
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onSwitchToSignIn }) => {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { tokens } = useTheme();
  
  // Custom validity states
  const [isInviteValid, setIsInviteValid] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      inviteCode: '',
      agreeTerms: undefined
    }
  });

  const email = watch('email');
  const password = watch('password');
  const inviteCode = watch('inviteCode');

  // --- Username Generation Logic ---
  const generateUniqueUsername = async (first: string, last: string) => {
    // Rule: lower(first.last) sanitized
    const base = `${first.trim()}.${last.trim()}`.toLowerCase().replace(/[^a-z0-9\.]/g, '');
    let candidate = base;
    
    // Check collision (best effort client-side check)
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', candidate)
      .maybeSingle();

    if (data) {
      // Collision: append 3 random digits
      const random = Math.floor(100 + Math.random() * 900);
      candidate = `${base}${random}`;
    }
    
    return candidate;
  };

  const onSubmit = async (data: SignUpFormData) => {
    // If invite code is entered but not valid (and not empty)
    if (data.inviteCode && !isInviteValid && data.inviteCode.length > 0) {
        setServerError('Invalid invite code');
        return;
    }

    setLoading(true);
    setServerError(null);

    try {
      // 1. Generate Username
      const username = await generateUniqueUsername(data.firstName, data.lastName);

      // 2. Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: username, // Store in meta for triggers
            first_name: data.firstName,
            last_name: data.lastName,
            invite_code_used: isInviteValid ? data.inviteCode : null,
            is_vip: isInviteValid
          }
        }
      });

      if (authError) throw authError;

      // 3. Upsert Profile (Ensure it exists with correct details)
      // Only attempt to write to DB if we have a session.
      // If email confirmation is required, authData.session will be null, and we can't write to profiles table due to RLS.
      // In that case, we rely on a backend trigger to create the profile from user_metadata.
      if (authData.user && authData.session) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: data.email,
          username: username,
          first_name: data.firstName,
          last_name: data.lastName,
          is_verified: false,
          is_founder: false,
          // dob and city left null for "Complete Profile" flow
        });

        if (profileError) {
          console.error("Profile creation warning:", profileError);
          // Don't block signup flow for profile non-critical error, but log it
        }
      }

      if (authData.session) {
        onSuccess();
      } else if (authData.user) {
        setStep('verify');
      }
    } catch (err: any) {
      const errorMsg = formatSupabaseError(err);
      setServerError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return <EmailVerification email={email} onVerified={onSuccess} onBack={onSwitchToSignIn} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in slide-in-from-right duration-300">
       
       {/* Name Fields */}
       <div className="grid grid-cols-2 gap-3">
         <div className="space-y-1.5 group">
           <label className={`text-[10px] font-bold ${tokens.mutedText} uppercase ml-1 tracking-widest group-focus-within:text-primary transition-colors`}>First Name</label>
           <input 
             {...register('firstName')}
             className={`w-full ${tokens.surface2} border rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all ${errors.firstName ? 'border-status-red/50 focus:ring-status-red/50' : `${tokens.border} focus:border-primary/50 focus:ring-primary/50`}`}
             placeholder="Jane"
           />
           {errors.firstName && <p className="text-[10px] text-status-red ml-1 font-medium">{errors.firstName.message}</p>}
         </div>
         <div className="space-y-1.5 group">
           <label className={`text-[10px] font-bold ${tokens.mutedText} uppercase ml-1 tracking-widest group-focus-within:text-primary transition-colors`}>Last Name</label>
           <input 
             {...register('lastName')}
             className={`w-full ${tokens.surface2} border rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all ${errors.lastName ? 'border-status-red/50 focus:ring-status-red/50' : `${tokens.border} focus:border-primary/50 focus:ring-primary/50`}`}
             placeholder="Doe"
           />
           {errors.lastName && <p className="text-[10px] text-status-red ml-1 font-medium">{errors.lastName.message}</p>}
         </div>
       </div>

       {/* Email */}
       <div className="space-y-1.5 group">
         <label className={`text-[10px] font-bold ${tokens.mutedText} uppercase ml-1 tracking-widest group-focus-within:text-primary transition-colors`}>Email Address</label>
         <div className="relative">
           <input 
             {...register('email')}
             type="email" 
             className={`w-full ${tokens.surface2} border rounded-2xl p-4 pl-11 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all ${errors.email ? 'border-status-red/50 focus:ring-status-red/50' : `${tokens.border} focus:border-primary/50 focus:ring-primary/50`}`}
             placeholder="you@example.com"
           />
           <span className="material-symbols-outlined absolute left-4 top-4 text-gray-500 text-[20px] group-focus-within:text-white transition-colors">mail</span>
         </div>
         {errors.email && <p className="text-[10px] text-status-red ml-1 font-medium">{errors.email.message}</p>}
       </div>

       {/* Password */}
       <div className="space-y-1.5 group">
         <label className={`text-[10px] font-bold ${tokens.mutedText} uppercase ml-1 tracking-widest group-focus-within:text-primary transition-colors`}>Password</label>
         <div className="relative">
           <input 
             {...register('password')}
             type="password" 
             className={`w-full ${tokens.surface2} border rounded-2xl p-4 pl-11 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all ${errors.password ? 'border-status-red/50 focus:ring-status-red/50' : `${tokens.border} focus:border-primary/50 focus:ring-primary/50`}`}
             placeholder="••••••••"
           />
           <span className="material-symbols-outlined absolute left-4 top-4 text-gray-500 text-[20px] group-focus-within:text-white transition-colors">lock</span>
         </div>
         <PasswordStrengthMeter password={password} />
         {errors.password && <p className="text-[10px] text-status-red ml-1 font-medium">{errors.password.message}</p>}
       </div>

       {/* Confirm Password */}
       <div className="space-y-1.5 group">
         <label className={`text-[10px] font-bold ${tokens.mutedText} uppercase ml-1 tracking-widest group-focus-within:text-primary transition-colors`}>Confirm Password</label>
         <div className="relative">
           <input 
             {...register('confirmPassword')}
             type="password" 
             className={`w-full ${tokens.surface2} border rounded-2xl p-4 pl-11 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all ${errors.confirmPassword ? 'border-status-red/50 focus:ring-status-red/50' : `${tokens.border} focus:border-primary/50 focus:ring-primary/50`}`}
             placeholder="••••••••"
           />
           <span className="material-symbols-outlined absolute left-4 top-4 text-gray-500 text-[20px] group-focus-within:text-white transition-colors">lock_reset</span>
         </div>
         {errors.confirmPassword && <p className="text-[10px] text-status-red ml-1 font-medium">{errors.confirmPassword.message}</p>}
       </div>

       {/* Invite Code */}
       <InviteCodeInput 
         value={inviteCode || ''} 
         onChange={(val, valid) => {
             setValue('inviteCode', val);
             setIsInviteValid(valid);
         }} 
       />

       {/* Terms Checkbox */}
       <div className="flex items-start gap-3 px-1 pt-2">
          <div className="relative flex items-center mt-0.5">
              <input 
                  type="checkbox"
                  id="terms"
                  {...register('agreeTerms')}
                  className="peer size-5 appearance-none rounded border border-white/30 bg-black/20 checked:bg-primary checked:border-primary transition-all cursor-pointer"
              />
              <span className="material-symbols-outlined absolute left-0.5 top-0.5 text-black text-sm pointer-events-none opacity-0 peer-checked:opacity-100">check</span>
          </div>
          <label htmlFor="terms" className="text-xs text-gray-400 leading-snug cursor-pointer select-none">
              I agree to the <a href="#" className="text-white hover:underline font-bold">Terms of Service</a> and <a href="#" className="text-white hover:underline font-bold">Privacy Policy</a>.
          </label>
       </div>
       {errors.agreeTerms && <p className="text-[10px] text-status-red ml-1 font-medium">{errors.agreeTerms.message}</p>}

       {/* Error Banner */}
       {serverError && (
          <div className={`p-3 ${tokens.closedBg} border ${tokens.border} rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2`}>
              <span className={`material-symbols-outlined ${tokens.closedRed} text-lg shrink-0 mt-0.5`}>error</span>
              <p className={`text-xs ${tokens.closedRed} font-medium break-words leading-relaxed`}>{serverError}</p>
          </div>
       )}

       {/* Submit */}
       <div className="pt-2">
          <PrimaryButton type="submit" disabled={loading} className="w-full shadow-neon">
              {loading ? (
                  <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      Creating Account...
                  </span>
              ) : 'Join Where2'}
          </PrimaryButton>
       </div>

       {/* Social Proof */}
       <div className="text-center flex flex-col items-center gap-1.5 mt-2">
          <div className="flex -space-x-2.5">
             {[1,2,3].map(i => (
                <div key={i} className="size-6 rounded-full border-2 border-black bg-gray-700 bg-cover grayscale" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${15+i})`}} />
             ))}
          </div>
          <p className="text-[10px] text-gray-500 font-medium">Join 1,247 early explorers in your city</p>
       </div>

    </form>
  );
};
