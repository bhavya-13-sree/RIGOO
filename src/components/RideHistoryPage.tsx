import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { RideHistoryItem, RatingReview } from '../types/index.ts';
import {
  Clock,
  Bike,
  CheckCircle2,
  Star,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  ChevronRight,
  Filter
} from 'lucide-react';

export const RideHistoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<RideHistoryItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState<RideHistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, [currentUser]);

  const loadHistory = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getHistory();
      setHistory(res.history || []);
    } catch (err) {
      console.warn('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = history.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#123F7A] tracking-tight">
            Ride History & Receipts
          </h1>
          <p className="text-sm text-slate-600">
            Archived record of your past bike-pooling journeys and fuel contributions.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filter === 'ALL' ? 'bg-white text-[#1769D2] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Rides ({history.length})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filter === 'COMPLETED' ? 'bg-white text-[#1769D2] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filter === 'CANCELLED' ? 'bg-white text-[#1769D2] shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No Past Rides in this Category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you complete a ride and share the journey, your verified ride history and fuel receipts will appear here permanently.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedHistory(item)}
              className="cursor-pointer bg-white rounded-3xl p-6 border-2 border-slate-200/80 hover:border-[#1769D2] hover:shadow-md transition space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {item.status}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {item.departure_time}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{item.start_location}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#123F7A] mt-1 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{item.destination}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  {item.distance_km} km · ~{item.duration_mins} mins
                </span>
                <div className="flex items-center gap-1 font-black text-[#1769D2]">
                  <span>Fuel Share: ₹{item.fuel_contribution}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#123F7A]">
                Journey Details & Receipt #{selectedHistory.id}
              </h3>
              <button
                onClick={() => setSelectedHistory(null)}
                className="font-bold text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <p><b>Origin:</b> {selectedHistory.start_location}</p>
              <p><b>Destination:</b> {selectedHistory.destination}</p>
              <p><b>Scheduled Departure:</b> {selectedHistory.departure_time}</p>
              <p><b>Completed At:</b> {new Date(selectedHistory.completed_at).toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-[#EAF3FF] border border-blue-200">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Road Distance</p>
                <p className="text-base font-black text-[#1769D2]">{selectedHistory.distance_km} km</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <p className="text-emerald-700 text-[10px] uppercase font-bold">Agreed Fuel Share</p>
                <p className="text-base font-black text-emerald-800">₹{selectedHistory.fuel_contribution}</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center">
              Verified non-commercial fuel cost sharing per RIGOO Community Guidelines.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
