import { XIcon } from "lucide-react";
import { AgentData } from "@/types/AgentData";


interface AreaSelectionResultsProps {
  agents: AgentData[];
  onClose: () => void;
}

const AreaSelectionResults = ({ agents, onClose }: AreaSelectionResultsProps) => {
  const exportToCSV = () => {
    const headers = [
      "TSA ID",
      "Employee Name", 
      "Role",
      "Division",
      "Department",
      "Personal Address",
      "State/Location",
      "Contact Number",
      "Manager Name",
      "Manager Contact Number",
      "2Up Manager Name",
      "2Up Manager Contact Number",
      "Emergency Contact",
      "Emergency Contact Number",
      "Emergency Contact Relationship"
    ];
    
    const csvData = agents.map(agent => [
      agent["TSA ID"],
      `"${agent["Emp Name"]}"`,
      `"${agent.Role}"`,
      `"${agent.Division}"`,
      `"${agent.Department}"`, 
      `"${agent.PersonalAddress}"`,
      `"${agent["State/Location"]}"`,
      `"${agent["Emp Contact #"]}"`,
      `"${agent["Manager Name"]}"`,
      `"${agent["Manager Contact #"]}"`,
      `"${agent["2nd Manager Name"]}"`,
      `"${agent["2nd Manager Contact #"]}"`,
      `"${agent["Emergency Contact Name"]}"`,
      `"${agent["Emergency Contact #"]}"`,
      `"${agent["Emergency Contact Relationship"]}"`,
    ]);
    
    const csvContent = [headers.join(",")]
      .concat(csvData.map(row => row.join(",")))
      .join("\n");
    
    // create csv 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `selected_employees_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute top-4 right-12 z-[100] bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-hidden">
      <div className="flex items-center justify-between border-b bg-gray-50">
        <h3 className="text-lg px-4 font-semibold text-gray-900">
          Selected Area Results
        </h3>

        <div className="bg-gray-50 p-3 flex gap-x-4">
          <button
            onClick={exportToCSV}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
          >
            Export
          </button>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <XIcon size={20} />
        </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <span className="text-sm text-gray-600">
            Found {agents.length} employee{agents.length !== 1 ? 's' : ''} in selected area
          </span>
        </div>
        
        <div className="overflow-y-auto max-h-64 space-y-2">
          {agents.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No employees found in the selected area
            </div>
          ) : (
            agents.map((agent) => (
              <div
                key={agent["TSA ID"]}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-semibold text-gray-900">
                  {agent["Emp Name"]}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {agent.Role}
                </div>
                <div className="text-sm text-gray-600">
                  {agent.Division}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  📍 {agent.PersonalAddress} - {agent["State/Location"]}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  ID: {agent["TSA ID"]}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  LOC: {agent.latitude}, {agent.longitude}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AreaSelectionResults;