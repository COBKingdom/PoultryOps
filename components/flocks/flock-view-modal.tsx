"use client";

import { X, Package, Calendar, MapPin, User, FileText } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  flock: any;
};

export default function FlockViewModal({ isOpen, onClose, flock }: Props) {
  if (!isOpen || !flock) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getBirdTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      Layers: "bg-blue-100 text-blue-700",
      Broilers: "bg-green-100 text-green-700",
      Growers: "bg-yellow-100 text-yellow-700",
      Cockerels: "bg-purple-100 text-purple-700",
    };
    return colors[type] || "bg-slate-100 text-slate-700";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Flock Details</h2>
            <p className="mt-1 text-sm text-slate-500">Viewing flock information</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">{flock.flock_name}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBirdTypeColor(flock.bird_type)}`}>
                {flock.bird_type}
              </span>
            </div>

            {/* General Information */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">General Information</h4>
              <div className="grid grid-cols-2 gap-4">
                {flock.batch_number && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Batch</p>
                    <p className="text-sm font-semibold text-slate-900">{flock.batch_number}</p>
                  </div>
                )}
                {flock.breed && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Breed</p>
                    <p className="text-sm font-semibold text-slate-900">{flock.breed}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bird Information */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Bird Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Package size={14} />
                    <p className="text-xs">Birds</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">
                    {Number(flock.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>

                {flock.age_weeks && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <Calendar size={14} />
                      <p className="text-xs">Age</p>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {flock.age_weeks} {flock.age_weeks === 1 ? 'week' : 'weeks'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location & Source */}
            {(flock.supplier || flock.arrival_date || flock.house || flock.pen) && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Location & Source</h4>
                <div className="grid grid-cols-2 gap-4">
                  {flock.supplier && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <User size={14} />
                        <p className="text-xs">Supplier</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{flock.supplier}</p>
                    </div>
                  )}
                  {flock.arrival_date && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Calendar size={14} />
                        <p className="text-xs">Arrival Date</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatDate(flock.arrival_date)}</p>
                    </div>
                  )}
                  {flock.house && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <MapPin size={14} />
                        <p className="text-xs">House</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{flock.house}</p>
                    </div>
                  )}
                  {flock.pen && (
                    <div className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <MapPin size={14} />
                        <p className="text-xs">Pen</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{flock.pen}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {flock.notes && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Notes</h4>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{flock.notes}</p>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500">
              Registered {formatDate(flock.created_at)}
              {flock.updated_at && ` • Updated ${formatDate(flock.updated_at)}`}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}