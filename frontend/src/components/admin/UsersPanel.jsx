import { useEffect } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { Users, Phone, Mail, ShoppingCart, Calendar } from "lucide-react";

export default function UsersPanel() {
  const { users, usersLoading, fetchUsers } = useAdminStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      
      <div className="flex items-center justify-between bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
               <Users className="text-[#f68048]" size={20} strokeWidth={2.5}/>
            </div>
            Përdoruesit & Konsumatorët
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-medium pl-12">Lista totale e llogarive të përdoruesve në aplikacionin tuaj.</p>
        </div>
        <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-600">
           Total: <span className="text-[#f68048] text-lg ml-1">{users.length}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm">
        {usersLoading ? (
           <div className="p-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
             <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#f68048] rounded-full animate-spin"></div>
             <span className="font-semibold text-sm">Duke shkarkuar listën e përdoruesve...</span>
           </div>
        ) : users.length === 0 ? (
          <div className="p-20 text-center">
             <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-4">
                <Users size={32} className="text-gray-300" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 mb-1">Nuk u gjenden përdorues.</h3>
             <p className="text-gray-500 text-sm">Mesa duket nuk keni klientë ende.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  <th className="px-6 py-5 font-extrabold text-[11px] uppercase tracking-wider text-gray-400">Përdoruesi</th>
                  <th className="px-6 py-5 font-extrabold text-[11px] uppercase tracking-wider text-gray-400"><span className="flex items-center gap-1.5"><Mail size={14}/> Email</span></th>
                  <th className="px-6 py-5 font-extrabold text-[11px] uppercase tracking-wider text-gray-400"><span className="flex items-center gap-1.5"><Phone size={14}/> Telefon</span></th>
                  <th className="px-6 py-5 font-extrabold text-[11px] uppercase tracking-wider text-gray-400"><span className="flex items-center gap-1.5"><Calendar size={14}/> Krijimi Llogarisë</span></th>
                  <th className="px-6 py-5 font-extrabold text-[11px] uppercase tracking-wider text-[#f68048]"><span className="flex items-center gap-1.5"><ShoppingCart size={14}/> Porosi</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-orange-50/20 transition-colors">
                    <td className="px-6 py-5 text-sm font-bold text-gray-900 capitalize">{user.name}</td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-500">{user.email}</td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-500">{user.phone_number || <span className="text-gray-300 italic">Pa Nr.</span>}</td>
                    <td className="px-6 py-5 text-sm font-medium text-gray-400 whitespace-nowrap">
                       {new Date(user.created_at).toLocaleDateString("sq-AL", {
                          day: "2-digit", month: "short", year: "numeric"
                       })}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-[#f68048] font-black text-xs border border-orange-100">
                         {user.total_orders || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}