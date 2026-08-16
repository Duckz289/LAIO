"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Mail, Lock, ArrowRight, Github } from "lucide-react";
import { isSupabaseConfigured, supabase, supabaseConfigError } from "@/lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    emailInputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loadingRef.current) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrorMsg(supabaseConfigError);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign("/dashboard");
          return;
        }
        setSuccessMsg("Đăng ký thành công. Hãy kiểm tra email để xác thực tài khoản.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        window.location.assign("/dashboard");
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "github") => {
    if (!isSupabaseConfigured) {
      setErrorMsg(supabaseConfigError);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/notebooks`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Không thể đăng nhập bằng GitHub.");
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp((current) => !current);
    setErrorMsg("");
    setSuccessMsg("");
    setPassword("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      {/* Backdrop - xuất hiện NGAY LẬP TỨC, không animation */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        disabled={loading}
        tabIndex={-1}
        aria-label="Đóng bằng cách bấm ra ngoài"
      />

      {/* Popup - chỉ popup này mới có animation */}
      <div className="relative z-10 w-full max-w-md animate-zoomIn">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-6 flex flex-col gap-5">
          
          <button 
            type="button"
            onClick={onClose} 
            disabled={loading}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all duration-200"
            aria-label="Đóng cửa sổ đăng nhập"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mt-2">
            <h2 id="auth-modal-title" className="text-2xl font-bold text-slate-900">
              {isSignUp ? "Tạo tài khoản mới" : "Chào mừng trở lại"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isSignUp ? "Bắt đầu hành trình làm chủ từ vựng cùng LAIO" : "Đăng nhập để tiếp tục lộ trình ôn tập"}
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600 animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {successMsg}
            </div>
          )}

          {!isSupabaseConfigured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              Tạo file <code className="font-semibold">frontend/.env.local</code> rồi thêm Supabase URL và public anon key. Không dùng secret key ở frontend.
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-email" className="text-xs font-semibold text-slate-700">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  id="auth-email"
                  ref={emailInputRef}
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-xs font-semibold text-slate-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={isSignUp ? 8 : undefined}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-sm transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1 mt-2 text-sm shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  {isSignUp ? "Đăng ký" : "Đăng nhập"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex py-2 items-center text-xs text-slate-400">
            <div className="flex-grow border-t border-slate-100" />
            <span className="flex-shrink mx-3">Hoặc tiếp tục với</span>
            <div className="flex-grow border-t border-slate-100" />
          </div>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            disabled={!isSupabaseConfigured || loading}
            className="w-full border border-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 text-slate-700 font-medium py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <Github className="w-4 h-4" />
            GitHub
          </button>

          <p className="text-center text-xs text-slate-500 mt-2">
            {isSignUp ? "Bạn đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isSignUp ? "Đăng nhập ngay" : "Tạo tài khoản miễn phí"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
