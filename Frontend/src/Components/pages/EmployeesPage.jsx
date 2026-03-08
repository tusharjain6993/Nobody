import { useState, useMemo } from "react";
import { Search, Filter, RotateCcw, ChevronDown, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, ArrowRight, UserCheck, UserX } from "lucide-react";

// Sample employee data
const staticEmployees = [
    {
        _id: "1", name: "Rajesh Kumar", role: "Senior Manager", email: "rajesh@example.com", phone: "+91-9876543210",
        department: "Administration", location: "Delhi", isActive: true,
        profile_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        joinDate: "2020-05-15", salary: "₹85,000"
    },
    {
        _id: "2", name: "Priya Mehta", role: "Welfare Officer", email: "priya@example.com", phone: "+91-9876543211",
        department: "Social Welfare", location: "Mumbai", isActive: true,
        profile_img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
        joinDate: "2021-03-20", salary: "₹65,000"
    },
    {
        _id: "3", name: "Arjun Sharma", role: "Revenue Inspector", email: "arjun@example.com", phone: "+91-9876543212",
        department: "Revenue & Land", location: "Bangalore", isActive: true,
        profile_img: "https://images.unsplash.com/photo-1519345182571-a0c06cde4d13?w=200&h=200&fit=crop",
        joinDate: "2019-08-10", salary: "₹72,000"
    },
    {
        _id: "4", name: "Sneha Patel", role: "Municipal Officer", email: "sneha@example.com", phone: "+91-9876543213",
        department: "Municipal & Civic", location: "Pune", isActive: true,
        profile_img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
        joinDate: "2020-11-05", salary: "₹78,000"
    },
    {
        _id: "5", name: "Vikram Singh", role: "Health Inspector", email: "vikram@example.com", phone: "+91-9876543214",
        department: "Health & Sanitation", location: "Hyderabad", isActive: false,
        profile_img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
        joinDate: "2021-01-15", salary: "₹68,000"
    },
    {
        _id: "6", name: "Ananya Gupta", role: "Education Coordinator", email: "ananya@example.com", phone: "+91-9876543215",
        department: "Education", location: "Kolkata", isActive: true,
        profile_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        joinDate: "2020-07-22", salary: "₹62,000"
    },
    {
        _id: "7", name: "Amit Verma", role: "Infrastructure Head", email: "amit@example.com", phone: "+91-9876543216",
        department: "Infrastructure Dev", location: "Delhi", isActive: true,
        profile_img: "https://images.unsplash.com/photo-1519345182571-a0c06cde4d13?w=200&h=200&fit=crop",
        joinDate: "2018-05-10", salary: "₹90,000"
    },
    {
        _id: "8", name: "Sanjay Patel", role: "Safety Director", email: "sanjay@example.com", phone: "+91-9876543217",
        department: "Public Safety", location: "Chennai", isActive: true,
        profile_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
        joinDate: "2019-09-12", salary: "₹88,000"
    },
];

export default function EmployeesPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [departmentFilter, setDepartmentFilter] = useState("All");
    const [sortBy, setSortBy] = useState("name");
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const departments = ["All", ...new Set(staticEmployees.map(e => e.department))];

    const filtered = useMemo(() => {
        return staticEmployees
            .filter((e) => {
                const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                    e.role.toLowerCase().includes(search.toLowerCase()) ||
                    e.department.toLowerCase().includes(search.toLowerCase());
                const matchStatus = statusFilter === "All" ||
                    (statusFilter === "Active" && e.isActive) ||
                    (statusFilter === "Inactive" && !e.isActive);
                const matchDept = departmentFilter === "All" || e.department === departmentFilter;
                return matchSearch && matchStatus && matchDept;
            })
            .sort((a, b) => {
                if (sortBy === "name") return a.name.localeCompare(b.name);
                if (sortBy === "department") return a.department.localeCompare(b.department);
                if (sortBy === "joinDate") return new Date(b.joinDate) - new Date(a.joinDate);
                return 0;
            });
    }, [search, statusFilter, departmentFilter, sortBy]);

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setDepartmentFilter("All");
        setSortBy("name");
    };

    const activeCount = staticEmployees.filter(e => e.isActive).length;

    return (
        <div className="min-h-screen bg-[#f8fafc] py-10 px-4 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            Team Directory
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 text-lg">
                            Manage and view {filtered.length} team members
                        </p>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm font-bold text-green-700">{activeCount} Active</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <UsersIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-600">{staticEmployees.length} Total</span>
                        </div>
                    </div>
                </div>

                {/* Filters Bar (Glassmorphism look) */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-slate-200/60 animate-in fade-in slide-in-from-top-4 duration-700 delay-100 z-10 relative">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, role, or department..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white border-2 rounded-2xl text-slate-900 outline-none transition-all focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] font-medium placeholder-slate-400"
                            />
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative min-w-[160px]">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full appearance-none pl-4 pr-10 py-3.5 bg-slate-50 border-transparent focus:bg-white border-2 rounded-2xl text-slate-700 font-semibold cursor-pointer outline-none transition-all focus:border-blue-500"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Active">Active Only</option>
                                    <option value="Inactive">Inactive Only</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>

                            <div className="relative min-w-[200px]">
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="w-full appearance-none pl-4 pr-10 py-3.5 bg-slate-50 border-transparent focus:bg-white border-2 rounded-2xl text-slate-700 font-semibold cursor-pointer outline-none transition-all focus:border-blue-500"
                                >
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept === "All" ? "All Departments" : dept}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>

                            <div className="relative min-w-[160px]">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full appearance-none pl-4 pr-10 py-3.5 bg-slate-50 border-transparent focus:bg-white border-2 rounded-2xl text-slate-700 font-semibold cursor-pointer outline-none transition-all focus:border-blue-500"
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="department">Sort by Dept</option>
                                    <option value="joinDate">Sort by Date</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>

                            <button
                                onClick={resetFilters}
                                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group"
                                title="Reset Filters"
                            >
                                <RotateCcw size={18} className="group-hover:-rotate-180 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No team members found</h3>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">We couldn't find anyone matching your current search and filter criteria.</p>
                        <button
                            onClick={resetFilters}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((emp, idx) => (
                            <div
                                key={emp._id}
                                onClick={() => setSelectedEmployee(emp)}
                                className="group relative bg-white rounded-[2rem] overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                                style={{ animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.05}s both` }}
                            >
                                {/* Card Header Banner */}
                                <div className="h-24 bg-gradient-to-br from-slate-100 to-blue-50 relative">
                                    <div className="absolute top-4 right-4 z-10">
                                        {emp.isActive ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-xs font-bold text-green-700 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full text-xs font-bold text-slate-500 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Avatar */}
                                <div className="px-6 relative -mt-12 mb-4">
                                    <img
                                        src={emp.profile_img}
                                        alt={emp.name}
                                        className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white group-hover:scale-105 transition-transform duration-500"
                                    />
                                </div>

                                {/* Body */}
                                <div className="px-6 pb-6">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-1 truncate">
                                        {emp.name}
                                    </h3>
                                    <p className="text-sm font-semibold text-blue-600 mb-4 truncate">
                                        {emp.role}
                                    </p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <Briefcase size={16} />
                                            </div>
                                            <span className="truncate font-medium">{emp.department}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <MapPin size={16} />
                                            </div>
                                            <span className="truncate font-medium">{emp.location}</span>
                                        </div>
                                    </div>

                                    {/* Action Row */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex gap-2">
                                            <a href={`mailto:${emp.email}`} onClick={e => e.stopPropagation()} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                <Mail size={16} />
                                            </a>
                                            <a href={`tel:${emp.phone}`} onClick={e => e.stopPropagation()} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-green-50 hover:text-green-600 transition-colors">
                                                <Phone size={16} />
                                            </a>
                                        </div>
                                        <button className="text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Profile <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Profile Modal */}
                {selectedEmployee && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedEmployee(null)} />

                        <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                            {/* Modal Banner */}
                            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                                <button
                                    onClick={() => setSelectedEmployee(null)}
                                    className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="px-8 pb-8">
                                {/* Modal Avatar & Header */}
                                <div className="flex justify-between items-end -mt-16 mb-6">
                                    <img
                                        src={selectedEmployee.profile_img}
                                        alt={selectedEmployee.name}
                                        className="w-32 h-32 rounded-3xl object-cover border-8 border-white shadow-xl bg-white"
                                    />
                                    <div className="pb-2">
                                        {selectedEmployee.isActive ? (
                                            <span className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold">
                                                <UserCheck size={16} /> Active Status
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">
                                                <UserX size={16} /> Inactive
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {selectedEmployee.name}
                                    </h2>
                                    <p className="text-lg font-bold text-blue-600 mt-1">{selectedEmployee.role}</p>
                                </div>

                                {/* Divider */}
                                <hr className="my-6 border-slate-100" />

                                {/* Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InfoBox icon={Briefcase} label="Department" value={selectedEmployee.department} />
                                    <InfoBox icon={MapPin} label="Location" value={selectedEmployee.location} />
                                    <InfoBox icon={Mail} label="Email Address" value={selectedEmployee.email} isLink href={`mailto:${selectedEmployee.email}`} />
                                    <InfoBox icon={Phone} label="Phone Number" value={selectedEmployee.phone} isLink href={`tel:${selectedEmployee.phone}`} />
                                </div>

                                {/* Highlight Cards */}
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-3xl border border-blue-100/50">
                                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                                            <DollarSign size={18} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Salary</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-900">{selectedEmployee.salary}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-3xl border border-purple-100/50">
                                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                                            <Calendar size={18} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Joined Date</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-900">
                                            {new Date(selectedEmployee.joinDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}} />
        </div>
    );
}

// Helper component for modal info blocks
const InfoBox = ({ icon: Icon, label, value, isLink, href }) => (
    <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
            <Icon size={18} />
        </div>
        <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            {isLink ? (
                <a href={href} className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate block transition-colors">
                    {value}
                </a>
            ) : (
                <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
            )}
        </div>
    </div>
);

// Basic Icon component since we used it in the header
const UsersIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
)



// import { useState, useMemo } from "react";
// import { Search, Filter, RotateCcw, ChevronDown, Mail, Phone, MapPin, Badge } from "lucide-react";

// // Sample employee data
// const staticEmployees = [
//     {
//         _id: "1", name: "Rajesh Kumar", role: "Senior Manager", email: "rajesh@example.com", phone: "+91-9876543210",
//         department: "Administration", location: "Delhi", isActive: true,
//         profile_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
//         joinDate: "2020-05-15", salary: "₹85,000"
//     },
//     {
//         _id: "2", name: "Priya Mehta", role: "Welfare Officer", email: "priya@example.com", phone: "+91-9876543211",
//         department: "Social Welfare", location: "Mumbai", isActive: true,
//         profile_img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
//         joinDate: "2021-03-20", salary: "₹65,000"
//     },
//     {
//         _id: "3", name: "Arjun Sharma", role: "Revenue Inspector", email: "arjun@example.com", phone: "+91-9876543212",
//         department: "Revenue & Land", location: "Bangalore", isActive: true,
//         profile_img: "https://images.unsplash.com/photo-1519345182571-a0c06cde4d13?w=200&h=200&fit=crop",
//         joinDate: "2019-08-10", salary: "₹72,000"
//     },
//     {
//         _id: "4", name: "Sneha Patel", role: "Municipal Officer", email: "sneha@example.com", phone: "+91-9876543213",
//         department: "Municipal & Civic", location: "Pune", isActive: true,
//         profile_img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
//         joinDate: "2020-11-05", salary: "₹78,000"
//     },
//     {
//         _id: "5", name: "Vikram Singh", role: "Health Inspector", email: "vikram@example.com", phone: "+91-9876543214",
//         department: "Health & Sanitation", location: "Hyderabad", isActive: false,
//         profile_img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
//         joinDate: "2021-01-15", salary: "₹68,000"
//     },
//     {
//         _id: "6", name: "Ananya Gupta", role: "Education Coordinator", email: "ananya@example.com", phone: "+91-9876543215",
//         department: "Education", location: "Kolkata", isActive: true,
//         profile_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
//         joinDate: "2020-07-22", salary: "₹62,000"
//     },
//     {
//         _id: "7", name: "Amit Verma", role: "Infrastructure Head", email: "amit@example.com", phone: "+91-9876543216",
//         department: "Infrastructure Dev", location: "Delhi", isActive: true,
//         profile_img: "https://images.unsplash.com/photo-1519345182571-a0c06cde4d13?w=200&h=200&fit=crop",
//         joinDate: "2018-05-10", salary: "₹90,000"
//     },
//     {
//         _id: "8", name: "Sanjay Patel", role: "Safety Director", email: "sanjay@example.com", phone: "+91-9876543217",
//         department: "Public Safety", location: "Chennai", isActive: true,
//         profile_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
//         joinDate: "2019-09-12", salary: "₹88,000"
//     },
// ];

// export default function EmployeesPage() {
//     const [search, setSearch] = useState("");
//     const [statusFilter, setStatusFilter] = useState("All");
//     const [departmentFilter, setDepartmentFilter] = useState("All");
//     const [sortBy, setSortBy] = useState("name");
//     const [selectedEmployee, setSelectedEmployee] = useState(null);

//     // Get unique departments
//     const departments = ["All", ...new Set(staticEmployees.map(e => e.department))];

//     // Filter logic
//     const filtered = useMemo(() => {
//         return staticEmployees
//             .filter((e) => {
//                 const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
//                     e.role.toLowerCase().includes(search.toLowerCase()) ||
//                     e.department.toLowerCase().includes(search.toLowerCase());
//                 const matchStatus = statusFilter === "All" ||
//                     (statusFilter === "Active" && e.isActive) ||
//                     (statusFilter === "Inactive" && !e.isActive);
//                 const matchDept = departmentFilter === "All" || e.department === departmentFilter;
//                 return matchSearch && matchStatus && matchDept;
//             })
//             .sort((a, b) => {
//                 if (sortBy === "name") return a.name.localeCompare(b.name);
//                 if (sortBy === "department") return a.department.localeCompare(b.department);
//                 if (sortBy === "joinDate") return new Date(b.joinDate) - new Date(a.joinDate);
//                 return 0;
//             });
//     }, [search, statusFilter, departmentFilter, sortBy]);

//     const resetFilters = () => {
//         setSearch("");
//         setStatusFilter("All");
//         setDepartmentFilter("All");
//         setSortBy("name");
//         setSelectedEmployee(null);
//     };

//     const activeCount = staticEmployees.filter(e => e.isActive).length;
//     const inactiveCount = staticEmployees.filter(e => !e.isActive).length;

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-8 px-4">
//             <div className="max-w-6xl mx-auto">
//                 {/* Header */}
//                 <div className="mb-8 animate-in fade-in slide-in-from-top-5 duration-700">
//                     <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
//                         <div>
//                             <h1 className="text-4xl md:text-5xl font-black text-slate-900 -tracking-tight">
//                                 👥 Team Members
//                             </h1>
//                             <p className="text-gray-600 text-base mt-1">
//                                 {filtered.length} of {staticEmployees.length} employees
//                             </p>
//                         </div>
//                         <div className="flex gap-3 flex-wrap">
//                             <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-2 rounded-xl border-2 border-green-200">
//                                 <div className="text-sm font-bold text-green-700">
//                                     ● {activeCount} Active
//                                 </div>
//                             </div>
//                             <div className="bg-gradient-to-r from-red-50 to-red-100 px-4 py-2 rounded-xl border-2 border-red-200">
//                                 <div className="text-sm font-bold text-red-600">
//                                     ● {inactiveCount} Inactive
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Filters Section */}
//                 <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-5 duration-700 delay-100">
//                     {/* Search Bar */}
//                     <div className="mb-6">
//                         <div className="relative">
//                             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
//                             <input
//                                 type="text"
//                                 placeholder="Search by name, role, or department..."
//                                 value={search}
//                                 onChange={(e) => setSearch(e.target.value)}
//                                 className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-base bg-white text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder-gray-400"
//                             />
//                         </div>
//                     </div>

//                     {/* Filter Controls */}
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
//                         {/* Status Filter */}
//                         <div>
//                             <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
//                                 📊 Status
//                             </label>
//                             <select
//                                 value={statusFilter}
//                                 onChange={(e) => setStatusFilter(e.target.value)}
//                                 className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-white text-slate-900 font-semibold cursor-pointer transition-all focus:border-blue-500"
//                             >
//                                 <option>All</option>
//                                 <option>Active</option>
//                                 <option>Inactive</option>
//                             </select>
//                         </div>

//                         {/* Department Filter */}
//                         <div>
//                             <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
//                                 🏢 Department
//                             </label>
//                             <select
//                                 value={departmentFilter}
//                                 onChange={(e) => setDepartmentFilter(e.target.value)}
//                                 className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-white text-slate-900 font-semibold cursor-pointer transition-all focus:border-blue-500"
//                             >
//                                 {departments.map(dept => (
//                                     <option key={dept}>{dept}</option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* Sort By */}
//                         <div>
//                             <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
//                                 🔀 Sort By
//                             </label>
//                             <select
//                                 value={sortBy}
//                                 onChange={(e) => setSortBy(e.target.value)}
//                                 className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-white text-slate-900 font-semibold cursor-pointer transition-all focus:border-blue-500"
//                             >
//                                 <option value="name">Name</option>
//                                 <option value="department">Department</option>
//                                 <option value="joinDate">Join Date</option>
//                             </select>
//                         </div>

//                         {/* Reset Button */}
//                         <div className="flex items-end">
//                             <button
//                                 onClick={resetFilters}
//                                 className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-200 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
//                             >
//                                 <RotateCcw size={16} />
//                                 Reset
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Empty State */}
//                 {filtered.length === 0 ? (
//                     <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200">
//                         <div className="text-6xl mb-4">👤</div>
//                         <h3 className="text-2xl font-black text-slate-900 mb-2">No employees found</h3>
//                         <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
//                         <button
//                             onClick={resetFilters}
//                             className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-all"
//                         >
//                             Reset Filters
//                         </button>
//                     </div>
//                 ) : (
//                     /* Grid */
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-700 delay-200">
//                         {filtered.map((emp, idx) => (
//                             <div
//                                 key={emp._id}
//                                 onClick={() => setSelectedEmployee(selectedEmployee?._id === emp._id ? null : emp)}
//                                 className="group bg-white rounded-2xl p-6 border-2 border-slate-200 hover:border-blue-400 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
//                                 style={{
//                                     animation: `slideUp 0.6s ease-out ${idx * 0.08}s both`,
//                                 }}
//                             >
//                                 {/* Top Section - Avatar & Status */}
//                                 <div className="flex items-start justify-between mb-4">
//                                     <div className="relative flex-shrink-0">
//                                         <img
//                                             src={emp.profile_img}
//                                             alt={emp.name}
//                                             className="w-14 h-14 rounded-2xl object-cover border-3 border-blue-100 group-hover:border-blue-400 transition-colors"
//                                         />
//                                         <span
//                                             className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-3 border-white ${emp.isActive ? "bg-green-500" : "bg-red-500"
//                                                 }`}
//                                         />
//                                     </div>
//                                     <span
//                                         className={`px-3 py-1 rounded-full text-xs font-bold ${emp.isActive
//                                                 ? "bg-green-100 text-green-700"
//                                                 : "bg-red-100 text-red-700"
//                                             }`}
//                                     >
//                                         {emp.isActive ? "Active" : "Inactive"}
//                                     </span>
//                                 </div>

//                                 {/* Name & Role */}
//                                 <h3 className="text-lg font-black text-slate-900 -tracking-tight mb-1 line-clamp-2">
//                                     {emp.name}
//                                 </h3>
//                                 <p className="text-sm font-semibold text-blue-600 mb-4 line-clamp-1">
//                                     {emp.role}
//                                 </p>

//                                 {/* Department Badge */}
//                                 <div className="mb-4">
//                                     <span className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold">
//                                         {emp.department}
//                                     </span>
//                                 </div>

//                                 {/* Quick Info */}
//                                 <div className="space-y-2 mb-5 text-sm">
//                                     <div className="flex items-center gap-2 text-gray-600">
//                                         <MapPin size={16} className="text-blue-500 flex-shrink-0" />
//                                         <span className="truncate">{emp.location}</span>
//                                     </div>
//                                     <div className="flex items-center gap-2 text-gray-600">
//                                         <Badge size={16} className="text-blue-500 flex-shrink-0" />
//                                         <span>{emp.salary}</span>
//                                     </div>
//                                 </div>

//                                 {/* View Button */}
//                                 <button className="w-full py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-600 font-bold rounded-lg transition-all border-2 border-blue-200 group-hover:border-blue-400">
//                                     View Details →
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 )}

//                 {/* Detail Modal */}
//                 {selectedEmployee && (
//                     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
//                         <div className="bg-white rounded-3xl p-8 max-w-md w-full border-4 border-blue-500 shadow-2xl animate-in slide-in-from-bottom-5 duration-500">
//                             {/* Header */}
//                             <div className="flex items-start justify-between mb-6">
//                                 <div className="flex items-center gap-4">
//                                     <img
//                                         src={selectedEmployee.profile_img}
//                                         alt={selectedEmployee.name}
//                                         className="w-20 h-20 rounded-2xl object-cover border-4 border-blue-200"
//                                     />
//                                     <div>
//                                         <h2 className="text-2xl font-black text-slate-900 -tracking-tight">
//                                             {selectedEmployee.name}
//                                         </h2>
//                                         <p className="text-blue-600 font-bold">{selectedEmployee.role}</p>
//                                     </div>
//                                 </div>
//                                 <button
//                                     onClick={() => setSelectedEmployee(null)}
//                                     className="p-2 hover:bg-slate-100 rounded-full transition-all"
//                                 >
//                                     ✕
//                                 </button>
//                             </div>

//                             {/* Details Grid */}
//                             <div className="space-y-3 mb-6">
//                                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
//                                     <Mail size={18} className="text-blue-500 flex-shrink-0" />
//                                     <div>
//                                         <div className="text-xs font-bold text-gray-600 uppercase">Email</div>
//                                         <a href={`mailto:${selectedEmployee.email}`} className="text-blue-600 font-semibold hover:underline truncate">
//                                             {selectedEmployee.email}
//                                         </a>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
//                                     <Phone size={18} className="text-blue-500 flex-shrink-0" />
//                                     <div>
//                                         <div className="text-xs font-bold text-gray-600 uppercase">Phone</div>
//                                         <a href={`tel:${selectedEmployee.phone}`} className="text-blue-600 font-semibold hover:underline">
//                                             {selectedEmployee.phone}
//                                         </a>
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
//                                     <MapPin size={18} className="text-blue-500 flex-shrink-0" />
//                                     <div>
//                                         <div className="text-xs font-bold text-gray-600 uppercase">Location</div>
//                                         <p className="text-slate-900 font-semibold">{selectedEmployee.location}</p>
//                                     </div>
//                                 </div>
//                                 <div className="grid grid-cols-3 gap-3">
//                                     <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-center">
//                                         <div className="text-xs font-bold text-gray-600 uppercase mb-1">Department</div>
//                                         <p className="text-sm font-bold text-blue-600">{selectedEmployee.department}</p>
//                                     </div>
//                                     <div className="p-3 bg-green-50 border-2 border-green-200 rounded-xl text-center">
//                                         <div className="text-xs font-bold text-gray-600 uppercase mb-1">Status</div>
//                                         <p className={`text-sm font-bold ${selectedEmployee.isActive ? "text-green-600" : "text-red-600"}`}>
//                                             {selectedEmployee.isActive ? "Active" : "Inactive"}
//                                         </p>
//                                     </div>
//                                     <div className="p-3 bg-purple-50 border-2 border-purple-200 rounded-xl text-center">
//                                         <div className="text-xs font-bold text-gray-600 uppercase mb-1">Salary</div>
//                                         <p className="text-sm font-bold text-purple-600">{selectedEmployee.salary}</p>
//                                     </div>
//                                 </div>
//                                 <div className="p-3 bg-amber-50 border-2 border-amber-200 rounded-xl">
//                                     <div className="text-xs font-bold text-gray-600 uppercase mb-1">Join Date</div>
//                                     <p className="text-slate-900 font-semibold">{new Date(selectedEmployee.joinDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
//                                 </div>
//                             </div>

//                             {/* Close Button */}
//                             <button
//                                 onClick={() => setSelectedEmployee(null)}
//                                 className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all"
//                             >
//                                 Close Details
//                             </button>
//                         </div>
//                     </div>
//                 )}
//             </div>

//             <style>{`
//                 @keyframes slideUp {
//                     from { opacity: 0; transform: translateY(30px); }
//                     to { opacity: 1; transform: translateY(0); }
//                 }
//             `}</style>
//         </div>
//     );
// }