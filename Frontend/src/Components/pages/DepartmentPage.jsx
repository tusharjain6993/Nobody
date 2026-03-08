import { useState, useMemo } from "react";
import { Search, X, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";

const DEPARTMENTS = [
    {
        id: 1, name: "General Administration", icon: "🏢",
        head: "Rajesh Kumar", employees: 24, activeCases: 12,
        description: "Handles overall administrative functions and policy implementation.",
        color: "#3b82f6",
        status: "Active",
        priority: "High",
        createdDate: "2023-01-15",
    },
    {
        id: 2, name: "Social Welfare", icon: "🤝",
        head: "Priya Mehta", employees: 18, activeCases: 8,
        description: "Manages social benefit schemes, pensions, and welfare programs.",
        color: "#10b981",
        status: "Active",
        priority: "High",
        createdDate: "2023-02-20",
    },
    {
        id: 3, name: "Revenue & Land", icon: "📜",
        head: "Arjun Sharma", employees: 15, activeCases: 5,
        description: "Oversees land records, revenue collection, and property disputes.",
        color: "#f59e0b",
        status: "Active",
        priority: "Medium",
        createdDate: "2023-03-10",
    },
    {
        id: 4, name: "Municipal & Civic", icon: "🏙️",
        head: "Sneha Patel", employees: 30, activeCases: 15,
        description: "Responsible for civic infrastructure, sanitation, and public utilities.",
        color: "#8b5cf6",
        status: "Active",
        priority: "Critical",
        createdDate: "2023-01-05",
    },
    {
        id: 5, name: "Health & Sanitation", icon: "🏥",
        head: "Vikram Singh", employees: 22, activeCases: 7,
        description: "Coordinates public health initiatives, hospitals, and sanitation drives.",
        color: "#ef4444",
        status: "Active",
        priority: "Critical",
        createdDate: "2023-02-28",
    },
    {
        id: 6, name: "Education", icon: "📚",
        head: "Ananya Gupta", employees: 20, activeCases: 4,
        description: "Manages schools, scholarships, and educational policy implementation.",
        color: "#06b6d4",
        status: "Inactive",
        priority: "Low",
        createdDate: "2023-04-12",
    },
    {
        id: 7, name: "Infrastructure Dev", icon: "🏗️",
        head: "Amit Verma", employees: 28, activeCases: 18,
        description: "Manages infrastructure development projects and construction.",
        color: "#ec4899",
        status: "Active",
        priority: "High",
        createdDate: "2023-03-25",
    },
    {
        id: 8, name: "Public Safety", icon: "🚨",
        head: "Sanjay Patel", employees: 32, activeCases: 22,
        description: "Oversees public safety, emergency services, and disaster management.",
        color: "#f97316",
        status: "Active",
        priority: "Critical",
        createdDate: "2023-01-30",
    },
];

const ITEMS_PER_PAGE = 6;

export default function DepartmentDashboard() {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [employeeRangeFilter, setEmployeeRangeFilter] = useState("All");

    // Filter logic
    const filtered = useMemo(() => {
        return DEPARTMENTS.filter((d) => {
            const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                d.head.toLowerCase().includes(search.toLowerCase()) ||
                d.description.toLowerCase().includes(search.toLowerCase());

            const matchStatus = statusFilter === "All" || d.status === statusFilter;
            const matchPriority = priorityFilter === "All" || d.priority === priorityFilter;

            let matchRange = true;
            if (employeeRangeFilter === "10-20") matchRange = d.employees >= 10 && d.employees <= 20;
            else if (employeeRangeFilter === "20-30") matchRange = d.employees > 20 && d.employees <= 30;
            else if (employeeRangeFilter === "30+") matchRange = d.employees > 30;

            return matchSearch && matchStatus && matchPriority && matchRange;
        });
    }, [search, statusFilter, priorityFilter, employeeRangeFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedDepts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setEmployeeRangeFilter("All");
        setCurrentPage(1);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "Critical": return { bg: "bg-red-100", text: "text-red-600", badge: "bg-red-50" };
            case "High": return { bg: "bg-orange-100", text: "text-orange-600", badge: "bg-orange-50" };
            case "Medium": return { bg: "bg-amber-100", text: "text-amber-600", badge: "bg-amber-50" };
            case "Low": return { bg: "bg-green-100", text: "text-green-600", badge: "bg-green-50" };
            default: return { bg: "bg-gray-100", text: "text-gray-600", badge: "bg-gray-50" };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Hero Section */}
                <div className="mb-10 animate-in fade-in slide-in-from-top-5 duration-700">
                    <div className="flex flex-wrap items-baseline gap-4 mb-2">
                        <h1 className="text-5xl font-black text-slate-900 -tracking-wide">
                            Departments
                        </h1>
                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold tracking-wider">
                            {filtered.length} RESULTS
                        </span>
                    </div>
                    <p className="text-gray-600 text-base font-normal">
                        Manage and organize all departments with advanced filters
                    </p>
                </div>

                {/* Search & Filters Section */}
                <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm animate-in fade-in slide-in-from-top-5 duration-700 delay-100">
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by department name, head, or description..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-base bg-white text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                                📊 Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-white text-slate-900 font-semibold cursor-pointer transition-all focus:border-blue-500"
                            >
                                <option>All</option>
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                                🎯 Priority
                            </label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => {
                                    setPriorityFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-white text-slate-900 font-semibold cursor-pointer transition-all focus:border-blue-500"
                            >
                                <option>All</option>
                                <option>Critical</option>
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                        </div>

                        {/* Employee Range Filter */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                                👥 Employee Count
                            </label>
                            <select
                                value={employeeRangeFilter}
                                onChange={(e) => {
                                    setEmployeeRangeFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-white text-slate-900 font-semibold cursor-pointer transition-all focus:border-blue-500"
                            >
                                <option>All</option>
                                <option value="10-20">10 - 20 Employees</option>
                                <option value="20-30">20 - 30 Employees</option>
                                <option value="30+">30+ Employees</option>
                            </select>
                        </div>
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={resetFilters}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-2 border-slate-200 rounded-lg text-sm font-bold transition-all"
                    >
                        <RotateCcw size={16} />
                        Reset Filters
                    </button>
                </div>

                {/* Cards Grid */}
                {paginatedDepts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-top-5 duration-700 delay-200">
                        {paginatedDepts.map((dept, idx) => (
                            <div
                                key={dept.id}
                                onClick={() => setSelected(selected?.id === dept.id ? null : dept)}
                                className={`bg-white rounded-2xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden ${selected?.id === dept.id
                                        ? "border-4 shadow-lg"
                                        : "border-2 border-slate-200 hover:shadow-md hover:-translate-y-1.5"
                                    }`}
                                style={{
                                    borderColor: selected?.id === dept.id ? dept.color : undefined,
                                    boxShadow: selected?.id === dept.id ? `0 10px 30px ${dept.color}33` : undefined,
                                    animation: `slideUp 0.6s ease-out ${idx * 0.08}s both`,
                                }}
                            >
                                {/* Accent Circle */}
                                <div
                                    className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-5 pointer-events-none"
                                    style={{
                                        background: `linear-gradient(135deg, ${dept.color}, ${dept.color}40)`,
                                    }}
                                />

                                {/* Header */}
                                <div className="mb-4 relative z-10">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border-2"
                                            style={{
                                                backgroundColor: `${dept.color}1a`,
                                                borderColor: `${dept.color}33`,
                                            }}
                                        >
                                            {dept.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="m-0 text-lg font-black text-slate-900 -tracking-tight">
                                                {dept.name}
                                            </h3>
                                            <div className="text-xs text-gray-600 mt-1 font-semibold">
                                                Head: <span className="text-slate-700 font-bold">{dept.head}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Priority & Status Badges */}
                                <div className="flex gap-2 mb-3 relative z-10 flex-wrap">
                                    <span
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider`}
                                        style={{
                                            backgroundColor: `${getPriorityColor(dept.priority).text}20`,
                                            color: getPriorityColor(dept.priority).text,
                                        }}
                                    >
                                        🎯 {dept.priority}
                                    </span>
                                    <span
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${dept.status === "Active"
                                                ? "bg-green-100 text-green-600"
                                                : "bg-slate-100 text-slate-600"
                                            }`}
                                    >
                                        {dept.status === "Active" ? "✓ Active" : "○ Inactive"}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed relative z-10 line-clamp-2">
                                    {dept.description}
                                </p>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                                    <div
                                        className="p-3 rounded-xl text-center border"
                                        style={{
                                            backgroundColor: `${dept.color}12`,
                                            borderColor: `${dept.color}26`,
                                        }}
                                    >
                                        <div className="text-2xl font-black" style={{ color: dept.color }}>
                                            {dept.employees}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 font-bold uppercase">
                                            Staff
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl text-center border bg-indigo-50 border-indigo-200">
                                        <div className="text-2xl font-black text-indigo-600">
                                            {dept.activeCases}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 font-bold uppercase">
                                            Cases
                                        </div>
                                    </div>
                                </div>

                                {/* Button */}
                                <button
                                    className="w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 relative z-10 border-2"
                                    style={{
                                        backgroundColor: selected?.id === dept.id ? dept.color : `${dept.color}12`,
                                        color: selected?.id === dept.id ? "#fff" : dept.color,
                                        borderColor: dept.color,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selected?.id !== dept.id) {
                                            e.target.style.backgroundColor = `${dept.color}1f`;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selected?.id !== dept.id) {
                                            e.target.style.backgroundColor = `${dept.color}12`;
                                        }
                                    }}
                                >
                                    {selected?.id === dept.id ? "Hide" : "View"}
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl mb-8 text-gray-600">
                        <div className="text-5xl mb-2">🔍</div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No departments found</h3>
                        <p className="text-base">Try adjusting your filters or search query</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mb-8 animate-in fade-in duration-700 delay-300 flex-wrap">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2.5 border-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${currentPage === 1
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "bg-white text-slate-900 border-slate-200 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                                }`}
                        >
                            <ChevronLeft size={18} />
                            Previous
                        </button>

                        <div className="flex gap-1 items-center">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all ${currentPage === page
                                            ? "bg-blue-500 text-white border-blue-500"
                                            : "bg-white text-slate-900 border-slate-200 hover:border-blue-500 hover:bg-blue-50"
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2.5 border-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${currentPage === totalPages
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "bg-white text-slate-900 border-slate-200 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                                }`}
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}

                {/* Detail Panel */}
                {selected && (
                    <div
                        className="bg-white rounded-2xl p-8 border-4 relative overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-5 duration-500"
                        style={{ borderColor: selected.color }}
                    >
                        {/* Background Gradient */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `linear-gradient(135deg, ${selected.color}0a 0%, transparent 100%)`,
                            }}
                        />

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 -tracking-tight m-0">
                                    {selected.icon} {selected.name}
                                </h2>
                                <p className="text-gray-600 mt-1 text-base">
                                    Complete department overview
                                </p>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="bg-slate-100 hover:bg-slate-200 border-none rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all text-gray-600 hover:text-gray-900 flex-shrink-0"
                                style={{
                                    color: selected.color,
                                    backgroundColor: `${selected.color}20`,
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = `${selected.color}33`;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = `${selected.color}20`;
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                            {[
                                { label: "Department Head", value: selected.head, icon: "👤" },
                                { label: "Total Staff", value: `${selected.employees}`, icon: "👥" },
                                { label: "Active Cases", value: `${selected.activeCases}`, icon: "📂" },
                                { label: "Status", value: selected.status, icon: "📊" },
                                { label: "Priority", value: selected.priority, icon: "🎯" },
                                { label: "Created", value: selected.createdDate, icon: "📅" },
                            ].map(({ label, value, icon }, idx) => (
                                <div
                                    key={label}
                                    className="p-5 rounded-xl border-2 animate-in fade-in slide-in-from-bottom-3 duration-500"
                                    style={{
                                        backgroundColor: `${selected.color}09`,
                                        borderColor: `${selected.color}26`,
                                        animationDelay: `${0.1 + idx * 0.08}s`,
                                    }}
                                >
                                    <div className="text-2xl mb-2">
                                        {icon}
                                    </div>
                                    <div className="text-xs text-gray-600 mb-2 font-bold uppercase tracking-wide">
                                        {label}
                                    </div>
                                    <div
                                        className="text-xl font-black"
                                        style={{
                                            color: label === "Priority"
                                                ? getPriorityColor(value).text
                                                : selected.color,
                                        }}
                                    >
                                        {value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}