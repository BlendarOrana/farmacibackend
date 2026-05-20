import { useState } from "react";
import { Percent, Clock, CalendarClock } from "lucide-react";

export default function DiscountModal({ isOpen, onClose, onApply, selectedCount }) {
  const [dType, setDType] = useState("percentage");
  const [dValue, setDValue] = useState("");
  const [savingD, setSavingD] = useState(false);
  const [duration, setDuration] = useState(7);
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [dStart, setDStart] = useState("");
  const [dEnd, setDEnd] = useState("");

  if (!isOpen) return null;

  const handleApply = async () => {
    setSavingD(true);
    let start_date, end_date;
    
    if (isCustomDate) {
      start_date = new Date(dStart).toISOString();
      end_date = new Date(dEnd).toISOString();
    } else {
      const now = new Date();
      const end = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
      start_date = now.toISOString();
      end_date = end.toISOString();
    }

    await onApply({
      discount_type: dType,
      discount_value: parseFloat(dValue),
      start_date,
      end_date,
    });

    setSavingD(false);
    setDValue(""); // Reset form
  };

  const isSubmitDisabled = savingD || !dValue || (isCustomDate && (!dStart || !dEnd));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-white rounded-[24px] max-w-[440px] w-full p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100">
        <h3 className="font-black text-2xl tracking-tight mb-2 text-gray-900 flex items-center gap-2">
          <Percent className="text-[#f68048]" size={24} strokeWidth={3} /> Zbritje e Re
        </h3>
        <p className="text-[14px] font-medium text-gray-500 mb-6">
          Jeni duke aplikuar zbritje për <span className="text-gray-900 font-bold bg-gray-50 px-2 py-0.5 rounded">{selectedCount} produkte</span>.
        </p>

        <div className="space-y-5 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${dType === "percentage" ? "border-[#f68048] bg-orange-50 text-[#f68048]" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
              onClick={() => setDType("percentage")}
            >
              Përqindje (%)
            </button>
            <button
              className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${dType === "fixed" ? "border-[#f68048] bg-orange-50 text-[#f68048]" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
              onClick={() => setDType("fixed")}
            >
              Çmim Fiks (€)
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vlera e Zbritjes</label>
            <input
              type="number"
              className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-lg font-black text-gray-900 outline-none border-2 border-transparent focus:bg-white focus:border-[#f68048] transition-all"
              value={dValue}
              onChange={(e) => setDValue(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock size={12} /> Kohëzgjatja
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 7, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    setDuration(days);
                    setIsCustomDate(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all flex-1 ${
                    !isCustomDate && duration === days
                      ? "border-[#f68048] bg-orange-50 text-[#f68048]"
                      : "border-gray-100 text-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {days} Ditë
                </button>
              ))}
              <button
                onClick={() => setIsCustomDate(true)}
                className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all flex-1 ${
                  isCustomDate
                    ? "border-[#f68048] bg-orange-50 text-[#f68048]"
                    : "border-gray-100 text-gray-400 hover:bg-gray-50"
                }`}
              >
                Tjetër
              </button>
            </div>
          </div>

          {isCustomDate && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CalendarClock size={12} /> Fillon më
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm font-bold text-gray-700 outline-none border-2 border-transparent focus:bg-white focus:border-[#f68048]"
                  value={dStart}
                  onChange={(e) => setDStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CalendarClock size={12} /> Përfundon më
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-gray-50 rounded-xl px-3 py-3 text-sm font-bold text-gray-700 outline-none border-2 border-transparent focus:bg-white focus:border-[#f68048]"
                  value={dEnd}
                  onChange={(e) => setDEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            Anulo
          </button>
          <button
            className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#f68048] hover:bg-[#e67540] shadow-lg shadow-[#f68048]/20 transition-transform active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
            onClick={handleApply}
            disabled={isSubmitDisabled}
          >
            {savingD ? (
              <div className="w-4 h-4 border-2 border-white/50 border-t-white animate-spin rounded-full" />
            ) : (
              "Ruaj Zbritjen"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}