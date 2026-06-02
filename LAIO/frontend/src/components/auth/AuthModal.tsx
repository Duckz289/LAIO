"use client";

import React, { useState } from "react";
import { X, Mail, Lock, ArrowRight, Github } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Đăng ký thành công! Hãy kiểm tra hộp thư Email để xác thực tài khoản.");
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/notebooks";
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "github") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/notebooks`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - xuất hiện NGAY LẬP TỨC, không animation */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Popup - chỉ popup này mới có animation */}
      <div className="relative z-10 w-full max-w-md animate-zoomIn">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-6 flex flex-col gap-5">
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mt-2">
            <h2 className="text-2xl font-bold text-slate-900">
              {isSignUp ? "Tạo tài khoản mới" : "Chào mừng trở lại"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isSignUp ? "Bắt đầu hành trình làm chủ từ vựng cùng LAIO" : "Đăng nhập để tiếp tục lộ trình ôn tập"}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2 rounded-xl animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 text-sm transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
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
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1 mt-2 text-sm shadow-sm"
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

          <div className="relative flex py-2 items-center text-xs text-slate-400">
            <div className="flex-grow border-t border-slate-100" />
            <span className="flex-shrink mx-3">Hoặc tiếp tục với</span>
            <div className="flex-grow border-t border-slate-100" />
          </div>

          <button
            type="button"
            onClick={() => handleOAuthLogin("github")}
            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <Github className="w-4 h-4" />
            GitHub
          </button>

          <p className="text-center text-xs text-slate-500 mt-2">
            {isSignUp ? "Bạn đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
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