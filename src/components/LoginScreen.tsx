import React from "react";
import { Globe, Play } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

interface LoginScreenProps {
  isAllowed?: boolean;
}

export function LoginScreen({ isAllowed }: LoginScreenProps) {
  return (
    <div className="min-h-screen bg-[#141414] text-[#E4E3E0] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="w-20 h-20 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <Globe className="w-10 h-10 text-black" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-serif italic text-emerald-400">
            Strategy Lab
          </h1>
          <p className="text-sm opacity-60">
            AI Debate Simulator & Market Readiness Refiner
          </p>
        </div>
        <p className="text-xs leading-relaxed opacity-40 font-mono uppercase tracking-widest">
          Authentication Required to Access Vertex AI & Gemini Models
        </p>
        {isAllowed === false && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in zoom-in duration-300">
            <p className="text-red-400 text-xs">
              ごめんなさい、あなたのメールアドレスは許可リストにありません。管理者に連絡してくださいわ。🌹
            </p>
          </div>
        )}
        <button
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-current" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
