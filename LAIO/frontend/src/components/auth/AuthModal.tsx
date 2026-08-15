"use client";

import React, { useEffect, useId, useState } from "react";
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
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Đăng ký thành công. Hãy kiểm tra email để xác thực tài khoản.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/notebooks";
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/notebooks`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Không thể đăng nhập bằng GitHub.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="absolute inset-0 bg-[#0d2b24]/60" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md animate-zoomIn">
        <div className="flex flex-col gap-5 overflow-hidden rounded-[30px] border-[3px] border-[#173f34] bg-[#fffdf7] p-6 shadow-2xl shadow-[#0d2b24]/20 sm:p-7">
          
          <button 
            onClick={onClose} 
            aria-label="Đóng cửa sổ đăng nhập"
            className="absolute right-4 top-4 rounded-xl border-2 border-transparent p-2 text-[#426157] transition-colors duration-200 hover:border-[#173f34] hover:bg-[#f4eedf] hover:text-[#173f34]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mt-2">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[20px] border-[3px] border-[#173f34] bg-[#f8df7d] text-xl font-black text-[#173f34]">L</div>
            <h2 id="auth-modal-title" className="landing-display text-2xl font-black tracking-[-0.035em] text-[#173f34]">
              {isSignUp ? "Tạo tài khoản mới" : "Chào mừng trở lại"}
            </h2>
            <p className="mt-2 text-sm font-medium text-[#597168]">
              {isSignUp ? "Bắt đầu hành trình làm chủ từ vựng cùng LAIO" : "Đăng nhập để tiếp tục lộ trình ôn tập"}
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="animate-shake rounded-xl border-2 border-[#dc6b5b] bg-[#fff0e9] px-3 py-2 text-xs font-semibold text-[#8a2f24]">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div role="status" className="rounded-xl border-2 border-[#65a36d] bg-[#eef8e6] px-3 py-2 text-xs font-semibold text-[#285c38]">
              {successMsg}
            </div>
          )}

          {!isSupabaseConfigured && (
            <div className="rounded-xl border-2 border-[#d7b83f] bg-[#fff7cf] px-3 py-2 text-xs font-semibold leading-relaxed text-[#654f0a]">
              Tạo file <code className="font-semibold">frontend/.env.local</code> rồi thêm Supabase URL và public anon key. Không dùng secret key ở frontend.
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={emailId} className="text-xs font-black text-[#173f34]">Địa chỉ email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  id={emailId}
                  placeholder="name@example.com"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#173f3430] bg-white py-3 pl-9 pr-4 text-sm text-[#173f34] transition-colors duration-200 placeholder:text-[#759087] focus:border-[#173f34] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={passwordId} className="text-xs font-black text-[#173f34]">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  id={passwordId}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#173f3430] bg-white py-3 pl-9 pr-4 text-sm text-[#173f34] transition-colors duration-200 placeholder:text-[#759087] focus:border-[#173f34] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="mt-2 flex w-full items-center justify-center gap-1 rounded-full border-[3px] border-[#173f34] bg-[#f8df7d] py-3 text-sm font-black text-[#173f34] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Đăng ký" : "Đăng nhập"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center py-2 text-xs font-semibold text-[#759087]">
            <div className="flex-grow border-t border-[#173f3425]" />
            <span className="flex-shrink mx-3">Hoặc tiếp tục với</span>
            <div className="flex-grow border-t border-[#173f3425]" />
          </div>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            disabled={!isSupabaseConfigured}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#173f3435] bg-white py-3 text-sm font-black text-[#173f34] transition-colors duration-200 hover:border-[#173f34] hover:bg-[#f4eedf] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Github className="w-4 h-4" />
            GitHub
          </button>

          <p className="mt-2 text-center text-xs font-medium text-[#597168]">
            {isSignUp ? "Bạn đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-black text-[#d94736] hover:underline"
            >
              {isSignUp ? "Đăng nhập ngay" : "Tạo tài khoản miễn phí"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}