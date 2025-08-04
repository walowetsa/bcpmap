"use client"
import MapBox from "@/components/layers/MapBox";
import Logo from "@/components/ui/Logo";
import Menu from "@/components/ui/Menu";
import Filter, { FilterState } from "@/components/ui/Filter";
import AreaSelectionResults from "@/components/ui/AreaSelectionResults";
import { useState, useCallback, useEffect } from "react";
import { AgentData } from "@/types/AgentData";

export default function Home() {
  const [enableLocationPins, setEnableLocationPins] = useState(true);
  const [enableHeatmap, setEnableHeatmap] = useState(true);
  const [isAreaSelectActive, setIsAreaSelectActive] = useState(false);
  const [isFiltersActive, setIsFiltersActive] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<AgentData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    stateLocation: [],
    division: [],
    department: [],
    managerName: []
  });

  // Fetch agent data for the filter component
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const response = await fetch('/api/get-excel-data');
        const result = await response.json();
        
        if (result.data) {
          // Filter out any records with invalid coordinates
          const validAgents = result.data.filter((agent: AgentData) => 
            agent.latitude && agent.longitude && 
            !isNaN(agent.latitude) && !isNaN(agent.longitude) &&
            agent.latitude !== 0 && agent.longitude !== 0
          );
          
          setAgentData(validAgents);
          console.log(`Loaded ${validAgents.length} valid agent locations for filtering`);
        }
      } catch (error) {
        console.error('Error fetching agent data for filters:', error);
      }
    };

    if (isFiltersActive && agentData.length === 0) {
      fetchAgentData();
    }
  }, [isFiltersActive, agentData.length]);

  const handleMapLoad = useCallback((map: mapboxgl.Map) => {
    console.log('Map loaded!', map);
  }, []);

  const handleLocationPinToggle = useCallback(() => {
    setEnableLocationPins(prev => !prev);
  }, []);

  const handleHeatmapToggle = useCallback(() => {
    setEnableHeatmap(prev => !prev);
  }, []);

  const handleAreaSelectToggle = useCallback(() => {
    setIsAreaSelectActive(prev => {
      const newValue = !prev;
      if (!newValue) {
        // When turning off area select, clear results
        setSelectedAgents([]);
        setShowResults(false);
      }
      return newValue;
    });
  }, []);

  const handleFiltersToggle = useCallback(() => {
    setIsFiltersActive(prev => !prev);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setIsFiltersActive(false);
  }, []);

  const handleAreaSelected = useCallback((agents: AgentData[]) => {
    setSelectedAgents(agents);
    setShowResults(true);
    // Automatically turn off area selection mode after selection
    setIsAreaSelectActive(false);
  }, []);

  const handleCloseResults = useCallback(() => {
    setShowResults(false);
    setSelectedAgents([]);
  }, []);

  return (
    <main className="flex-1">
      <div className="absolute top-4 left-4 z-[100]">
        <Logo />
      </div>
      
      {/* Filter Component */}
      <Filter
        agentData={agentData}
        onFilterChange={handleFilterChange}
        isVisible={isFiltersActive}
        onClose={handleCloseFilters}
      />
      
      <MapBox
        accessToken="your-mapbox-access-token"
        initialViewState={{
          longitude: 133.7751,
          latitude: -25.2744,  
          zoom: 4.5
        }}
        style="mapbox://styles/mapbox/streets-v12"
        className="w-screen h-screen"
        onMapLoad={handleMapLoad}
        showAgentMarkers={enableLocationPins}
        showHeatmap={enableHeatmap}
        markerColor="#3B82F6"
        markerSize={6}
        enableClustering={true}
        clusterRadius={50}
        clusterMaxZoom={14}
        heatmapIntensity={1.2}
        heatmapRadius={80}
        heatmapOpacity={0.7}
        isAreaSelectActive={isAreaSelectActive}
        onAreaSelected={handleAreaSelected}
        filters={filters}
      />
      {/* menu */}
      <div className='absolute bottom-12 left-[calc(50vw-120px)]'>
        <Menu 
          handleLocationPinToggle={handleLocationPinToggle}
          handleHeatmapToggle={handleHeatmapToggle}
          handleAreaSelectToggle={handleAreaSelectToggle}
          handleFiltersToggle={handleFiltersToggle}
          isAreaSelectActive={isAreaSelectActive}
          isFiltersActive={isFiltersActive}
        />
      </div>
      
      {/* Area selection results */}
      {showResults && (
        <AreaSelectionResults 
          agents={selectedAgents}
          onClose={handleCloseResults}
        />
      )}
    </main>
  );
}