import { useState, useEffect } from 'react';
import { AgentData } from '@/types/AgentData';

interface FilterState {
  stateLocation: string[];
  division: string[];
  department: string[];
  managerName: string[];
}

export const useAgentData = (shouldFetch: boolean, filters?: FilterState) => {
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const filterAgentData = (agents: AgentData[], currentFilters?: FilterState): AgentData[] => {
    if (!currentFilters || 
        (currentFilters.stateLocation.length === 0 && 
         currentFilters.division.length === 0 && 
         currentFilters.department.length === 0 && 
         currentFilters.managerName.length === 0)) {
      return agents;
    }

    return agents.filter(agent => {
      const stateMatch = currentFilters.stateLocation.length === 0 || 
                       currentFilters.stateLocation.includes(agent['State/Location']?.toString().trim() || '');
      
      const divisionMatch = currentFilters.division.length === 0 || 
                           currentFilters.division.includes(agent.Division?.toString().trim() || '');
      
      const departmentMatch = currentFilters.department.length === 0 || 
                             currentFilters.department.includes(agent.Department?.toString().trim() || '');
      
      const managerMatch = currentFilters.managerName.length === 0 || 
                          currentFilters.managerName.includes(agent['Manager Name']?.toString().trim() || '');

      return stateMatch && divisionMatch && departmentMatch && managerMatch;
    });
  };

  const getFilteredAgentData = (): AgentData[] => {
    return filterAgentData(agentData, filters);
  };

  const createGeoJSONData = (agents: AgentData[]) => {
    return {
      type: 'FeatureCollection',
      features: agents.map(agent => ({
        type: 'Feature',
        properties: {
          empName: agent['Emp Name'],
          tsaId: agent['TSA ID'],
          empContactNumber: agent['Emergency Contact #'],
          role: agent.Role,
          division: agent.Division,
          department: agent.Department,
          stateLocation: agent['State/Location'],
          managerName: agent['Manager Name'],
          managerContactNumber: agent['Manager Contact #'],
          secondaryManagerName: agent['2nd Manager Name'],
          secondaryManagerContactNumber: agent['2nd Manager Contact #'],
          emergencyContactName: agent['Emergency Contact Name'],
          emergencyContactRelationship: agent['Emergency Contact Relationship'], 
          emergencyContactContactNumber: agent['Emergency Contact #'],
          personalAddress: agent.PersonalAddress,
          latitude: agent.latitude,
          longitude: agent.longitude
        },
        geometry: {
          type: 'Point',
          coordinates: [agent.longitude, agent.latitude]
        }
      }))
    };
  };

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const response = await fetch('/api/get-excel-data');
        const result = await response.json();
        
        if (result.data) {
          const validAgents = result.data.filter((agent: AgentData) => 
            agent.latitude && agent.longitude && 
            !isNaN(agent.latitude) && !isNaN(agent.longitude) &&
            agent.latitude !== 0 && agent.longitude !== 0
          );
          
          setAgentData(validAgents);
          setDataLoaded(true);
          console.log(`Loaded ${validAgents.length} valid agent locations`);
        }
      } catch (error) {
        console.error('Error fetching agent data:', error);
      }
    };

    if (shouldFetch) {
      fetchAgentData();
    }
  }, [shouldFetch]);

  return {
    agentData,
    dataLoaded,
    getFilteredAgentData,
    createGeoJSONData
  };
};