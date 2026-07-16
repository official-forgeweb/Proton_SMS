'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  MessageSquare, 
  Smartphone, 
  FileText, 
  Clock, 
  Zap, 
  Bot, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function WhatsAppSandboxAdminPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const executeTest = async (endpoint: string, featureName: string, customData: object = {}) => {
    setLoadingFeature(featureName);
    setResponseLog(null);
    try {
      const payload = {
        to: phoneNumber.trim() || undefined,
        ...customData
      };
      const res = await api.post(`/whatsapp/test/${endpoint}`, payload);
      setResponseLog({
        status: res.status,
        timestamp: new Date().toLocaleTimeString(),
        feature: featureName,
        endpoint: `/api/whatsapp/test/${endpoint}`,
        data: res.data
      });
    } catch (err: any) {
      setResponseLog({
        status: err.response?.status || 500,
        timestamp: new Date().toLocaleTimeString(),
        feature: featureName,
        endpoint: `/api/whatsapp/test/${endpoint}`,
        error: err.response?.data || err.message
      });
    } finally {
      setLoadingFeature(null);
    }
  };

  const featuresList = [
    {
      id: 'inquiry',
      title: '1. Inquiry Confirmation',
      description: 'Send instant booking & counseling confirmation message to student upon web enquiry submission.',
      endpoint: 'inquiry',
      icon: MessageSquare,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      sample: {
        studentName: 'Aarav Sharma',
        courseName: 'JEE Main & Advanced 2-Year Program',
        counselorPhone: '+91 98765 43210'
      }
    },
    {
      id: 'fee-reminder',
      title: '2. Fee Reminder to Parents',
      description: 'Automated notification sent to parent phone number with amount due and direct Vercel payment link.',
      endpoint: 'fee-reminder',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      sample: {
        parentName: 'Rajesh Sharma',
        studentName: 'Aarav Sharma',
        amountDue: 12500,
        dueDate: '2026-07-25'
      }
    },
    {
      id: 'study-material',
      title: '3. Study Material Upload',
      description: 'Alert all enrolled batch students when new PDF notes or assignment sheets are published.',
      endpoint: 'study-material',
      icon: FileText,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      sample: {
        subjectName: 'Physics',
        topicName: 'Electrostatics & Gauss Law',
        uploadedBy: 'Dr. H.C. Verma'
      }
    },
    {
      id: 'video-lecture',
      title: '4. Video Lecture Alert',
      description: 'Notify students immediately when a recorded lecture chapter is live on portal.',
      endpoint: 'video-lecture',
      icon: Zap,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      sample: {
        subjectName: 'Mathematics',
        chapterNumber: 'Chapter 5',
        lectureTitle: 'Integration Definite Integrals'
      }
    },
    {
      id: 'timetable',
      title: '5. Weekly Timetable PDF',
      description: 'Sends weekly schedule as a WhatsApp media PDF document attachment.',
      endpoint: 'timetable',
      icon: Smartphone,
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      sample: {
        batchName: 'Super-30 Batch A',
        weekNumber: 'Week 29'
      }
    },
    {
      id: 'attendance',
      title: '6. Attendance Notification',
      description: 'Parent alert with attendance status indicator (🟢 Good / ⚠️ Warning / 🚨 Critical).',
      endpoint: 'attendance',
      icon: ShieldCheck,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      sample: {
        parentName: 'Rajesh Sharma',
        studentName: 'Aarav Sharma',
        percentage: 68
      }
    },
    {
      id: 'marketing',
      title: '7. Marketing Broadcast',
      description: 'Promotional WhatsApp message for upcoming events, crash courses or special discount offers.',
      endpoint: 'marketing',
      icon: Send,
      color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      sample: {
        recipientName: 'Valued Aspirant',
        title: '🔥 Early Bird 20% Scholarship Test Registration',
        offerEndDate: '2026-07-31'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Twilio WhatsApp Sandbox Integration</h1>
          </div>
          <p className="text-sm text-slate-400">
            Test and trigger all 7 automated WhatsApp features live with Sandbox phone numbers & webhook integration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => executeTest('all', 'Feature Bulk Test (All 7 Features)')}
            disabled={!!loadingFeature}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loadingFeature === 'Feature Bulk Test (All 7 Features)' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>Run All 7 Features Bulk Test</span>
          </button>
        </div>
      </div>

      {/* Target Recipient Input */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl space-y-3">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Target Recipient WhatsApp Phone Number
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. +919876543210 or whatsapp:+919876543210 (Leave empty to use process.env.TEST_PHONE_NUMBER)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sandbox Joined Number Required</span>
          </div>
        </div>
      </div>

      {/* Grid: 7 Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {featuresList.map((feat) => {
          const Icon = feat.icon;
          const isLoading = loadingFeature === feat.title;

          return (
            <div
              key={feat.id}
              className="bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800">
                    POST
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-base">{feat.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{feat.description}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                <div className="text-[11px] font-mono text-slate-500">
                  /api/whatsapp/test/{feat.endpoint}
                </div>

                <button
                  onClick={() => executeTest(feat.endpoint, feat.title, feat.sample)}
                  disabled={!!loadingFeature}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Test {feat.title.split('.')[1]}</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Feature 8 & 9 Webhook Status Card */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl border bg-amber-500/10 text-amber-400 border-amber-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                WEBHOOKS
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-base">8 & 9. Webhooks & Auto-Reply</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Handles keyword auto-replies (fee, timetable, notes, attendance) and receives Twilio message delivery receipts.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <button
              onClick={() => executeTest('../webhook/incoming', 'Incoming Webhook Auto-Reply', { From: 'whatsapp:+919876543210', Body: 'fee' })}
              disabled={!!loadingFeature}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded-xl transition-all disabled:opacity-50"
            >
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Incoming "fee" Webhook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Response Output Section */}
      {responseLog && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {responseLog.status === 200 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
              <h4 className="font-semibold text-sm text-white">
                API Test Response Log — {responseLog.feature}
              </h4>
              <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-mono">
                Status: {responseLog.status}
              </span>
            </div>
            <button
              onClick={() => handleCopy(JSON.stringify(responseLog, null, 2), 'log')}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedKey === 'log' ? 'Copied JSON!' : 'Copy Response'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-400/90 overflow-x-auto border border-slate-800/80 max-h-96 leading-relaxed">
            {JSON.stringify(responseLog, null, 2)}
          </pre>
        </div>
      )}

      {/* Twilio Setup Instructions Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="font-semibold text-slate-200 text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Quick Twilio Sandbox Setup & Verification Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/70 space-y-2">
            <div className="font-semibold text-slate-300">1. Twilio Sandbox Activation</div>
            <p className="text-slate-400 leading-relaxed">
              Send text message <code className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded">join &lt;your-sandbox-keyword&gt;</code> to <code className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded">+1 415 523 8886</code> from recipient phone.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/70 space-y-2">
            <div className="font-semibold text-slate-300">2. Configure Live Vercel Webhook URLs</div>
            <p className="text-slate-400 leading-relaxed">
              In Twilio Console &gt; WhatsApp Sandbox Settings, set Incoming Webhook to:
              <br />
              <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded block mt-1 overflow-x-auto">
                https://your-app.vercel.app/api/whatsapp/webhook/incoming
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
