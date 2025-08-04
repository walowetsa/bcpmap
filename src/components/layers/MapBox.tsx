/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AgentData } from '@/types/AgentData';

interface FilterState {
  stateLocation: string[];
  division: string[];
  department: string[];
  managerName: string[];
}

interface MapboxMapProps {
  accessToken: string;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  style?: string;
  className?: string;
  onMapLoad?: (map: mapboxgl.Map) => void;
  showAgentMarkers?: boolean;
  showHeatmap?: boolean;
  markerColor?: string;
  markerSize?: number;
  enableClustering?: boolean;
  clusterRadius?: number;
  clusterMaxZoom?: number;
  heatmapIntensity?: number;
  heatmapRadius?: number;
  heatmapOpacity?: number;
  isAreaSelectActive?: boolean;
  onAreaSelected?: (agents: AgentData[]) => void;
  filters?: FilterState;
}

const MapBox: React.FC<MapboxMapProps> = ({
  accessToken,
  initialViewState = {
    longitude: 133.775,
    latitude: -25.2744,
    zoom: 12
  },
  style = 'mapbox://styles/williamlowedev/cmdpe837p00fs01rh1p2d6q2t/7',
  className = '',
  onMapLoad,
  showAgentMarkers = false,
  showHeatmap = false,
  markerColor = '#3B82F6',
  markerSize = 8,
  enableClustering = true,
  clusterRadius = 50,
  clusterMaxZoom = 14,
  heatmapRadius = 60,
  heatmapOpacity = 0.6,
  isAreaSelectActive = false,
  onAreaSelected,
  filters,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [agentData, setAgentData] = useState<AgentData[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // area selection
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<number[][]>([]);
  const [completedPolygon, setCompletedPolygon] = useState<number[][] | null>(null);
  const drawingHandlersRef = useRef<any>({});
  const onAreaSelectedRef = useRef(onAreaSelected);
  const agentDataRef = useRef<AgentData[]>([]);
  
  // Track event listeners to prevent duplicates
  const eventListenersAddedRef = useRef(false);

  useEffect(() => {
    onAreaSelectedRef.current = onAreaSelected;
  }, [onAreaSelected]);

  useEffect(() => {
    agentDataRef.current = agentData;
  }, [agentData]);

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

  // handle drawing
  useEffect(() => {
    if (completedPolygon && onAreaSelectedRef.current) {
      const agentsInPolygon = filterAgentsInPolygon(completedPolygon);
      onAreaSelectedRef.current(agentsInPolygon);
      setCompletedPolygon(null);
    }
  }, [completedPolygon]);

  // Point-in-polygon algorithm
  const isPointInPolygon = (point: [number, number], polygon: number[][]): boolean => {
    if (polygon.length < 3) return false;
    
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  const filterAgentsInPolygon = (polygon: number[][]): AgentData[] => {
    if (polygon.length < 3) return [];
    
    const filteredAgents = getFilteredAgentData();
    return filteredAgents.filter(agent => 
      isPointInPolygon([agent.longitude, agent.latitude], polygon)
    );
  };

  const addPolygonToMap = (coordinates: number[][]) => {
    if (!map.current || coordinates.length < 3) return;

    const polygonGeoJSON = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        },
        properties: {}
      }]
    };

    if (map.current.getSource('selection-polygon')) {
      map.current.removeLayer('selection-polygon-fill');
      map.current.removeLayer('selection-polygon-outline');
      map.current.removeSource('selection-polygon');
    }

    map.current.addSource('selection-polygon', {
      type: 'geojson',
      data: polygonGeoJSON as any
    });

    map.current.addLayer({
      id: 'selection-polygon-fill',
      type: 'fill',
      source: 'selection-polygon',
      paint: {
        'fill-color': '#3B82F6',
        'fill-opacity': 0.2
      }
    });

    map.current.addLayer({
      id: 'selection-polygon-outline',
      type: 'line',
      source: 'selection-polygon',
      paint: {
        'line-color': '#3B82F6',
        'line-width': 2,
        'line-dasharray': [2, 2]
      }
    });
  };

  const addDrawingPointsToMap = (coordinates: number[][]) => {
    if (!map.current || coordinates.length === 0) return;

    const pointsGeoJSON = {
      type: 'FeatureCollection',
      features: coordinates.map((coord, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coord
        },
        properties: { index }
      }))
    };

    if (map.current.getSource('drawing-points')) {
      map.current.removeLayer('drawing-points');
      map.current.removeSource('drawing-points');
    }

    map.current.addSource('drawing-points', {
      type: 'geojson',
      data: pointsGeoJSON as any
    });

    map.current.addLayer({
      id: 'drawing-points',
      type: 'circle',
      source: 'drawing-points',
      paint: {
        'circle-color': '#3B82F6',
        'circle-radius': 6,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2
      }
    });

    if (coordinates.length > 1) {
      const lineGeoJSON = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          },
          properties: {}
        }]
      };

      if (map.current.getSource('drawing-line')) {
        map.current.removeLayer('drawing-line');
        map.current.removeSource('drawing-line');
      }

      map.current.addSource('drawing-line', {
        type: 'geojson',
        data: lineGeoJSON as any
      });

      map.current.addLayer({
        id: 'drawing-line',
        type: 'line',
        source: 'drawing-line',
        paint: {
          'line-color': '#3B82F6',
          'line-width': 2,
          'line-dasharray': [4, 4]
        }
      });
    }
  };

  const clearDrawingLayers = () => {
    if (!map.current) return;

    const layersToRemove = [
      'drawing-points',
      'drawing-line', 
      'selection-polygon-fill',
      'selection-polygon-outline'
    ];

    const sourcesToRemove = [
      'drawing-points',
      'drawing-line',
      'selection-polygon'
    ];

    layersToRemove.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });

    sourcesToRemove.forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });
  };

  // Layer cleanup function
  const removeAgentLayers = () => {
    if (!map.current) return;

    const layersToRemove = ['clusters', 'cluster-count', 'unclustered-point'];
    const sourcesToRemove = ['agents'];

    layersToRemove.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });

    sourcesToRemove.forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });

    eventListenersAddedRef.current = false;
  };

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (isAreaSelectActive) {
      setIsDrawing(true);
      setPolygonCoordinates([]);
      map.current.getCanvas().style.cursor = 'crosshair';

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        if (!isAreaSelectActive) return;
        
        const clickCoords = [e.lngLat.lng, e.lngLat.lat];
        
        setPolygonCoordinates(prev => {
          const newCoords = [...prev, clickCoords];
          addDrawingPointsToMap(newCoords);
          return newCoords;
        });
      };

      // double-click handler to finish drawing
      const handleMapDoubleClick = (e: mapboxgl.MapMouseEvent) => {
        e.preventDefault();
        
        setPolygonCoordinates(currentCoords => {
          if (currentCoords.length < 3) return currentCoords;
          
          const closedPolygon = [...currentCoords, currentCoords[0]];
          addPolygonToMap(closedPolygon);
          
          setTimeout(() => {
            clearDrawingLayers();
          }, 100);
          
          setIsDrawing(false);
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
          
          setCompletedPolygon(currentCoords);
          
          return currentCoords;
        });
      };

      drawingHandlersRef.current.click = handleMapClick;
      drawingHandlersRef.current.dblclick = handleMapDoubleClick;

      map.current.on('click', handleMapClick);
      map.current.on('dblclick', handleMapDoubleClick);

    } else {
      setIsDrawing(false);
      setPolygonCoordinates([]);
      setCompletedPolygon(null);
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
      
      if (drawingHandlersRef.current.click) {
        map.current.off('click', drawingHandlersRef.current.click);
      }
      if (drawingHandlersRef.current.dblclick) {
        map.current.off('dblclick', drawingHandlersRef.current.dblclick);
      }
      
      clearDrawingLayers();
    }

    // cleanup
    return () => {
      if (map.current && drawingHandlersRef.current.click) {
        map.current.off('click', drawingHandlersRef.current.click);
      }
      if (map.current && drawingHandlersRef.current.dblclick) {
        map.current.off('dblclick', drawingHandlersRef.current.dblclick);
      }
    };
  }, [isAreaSelectActive, mapLoaded]);

  // fetch from data source
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

    if (showAgentMarkers || showHeatmap || isAreaSelectActive) {
      fetchAgentData();
    }
  }, [showAgentMarkers, showHeatmap, isAreaSelectActive]);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (showAgentMarkers) {
      if (dataLoaded && agentData.length > 0) {
        addAgentMarkers();
      }
      toggleLayerVisibility('clusters', true);
      toggleLayerVisibility('cluster-count', true);
      toggleLayerVisibility('unclustered-point', true);
    } else {
      toggleLayerVisibility('clusters', false);
      toggleLayerVisibility('cluster-count', false);
      toggleLayerVisibility('unclustered-point', false);
    }

    if (showHeatmap) {
      if (dataLoaded && agentData.length > 0) {
        addHeatmapLayer();
      }
      toggleLayerVisibility('agents-heatmap-layer', true);
    } else {
      toggleLayerVisibility('agents-heatmap-layer', false);
    }
  }, [mapLoaded, showAgentMarkers, showHeatmap, dataLoaded]);

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

  // update for filters
  const updateDataSources = () => {
    if (!map.current || !mapLoaded || !dataLoaded || agentData.length === 0) return;

    const filteredAgents = getFilteredAgentData();
    const geoJsonData = createGeoJSONData(filteredAgents);

    console.log(`Updating map with ${filteredAgents.length} filtered agents out of ${agentData.length} total`);

    if (map.current.getSource('agents')) {
      (map.current.getSource('agents') as mapboxgl.GeoJSONSource).setData(geoJsonData as any);
    }

    if (map.current.getSource('agents-heatmap')) {
      (map.current.getSource('agents-heatmap') as mapboxgl.GeoJSONSource).setData(geoJsonData as any);
    }
  };

  const addHeatmapLayer = () => {
    if (!map.current || !dataLoaded || agentData.length === 0) return;

    const filteredAgents = getFilteredAgentData();
    const geoJsonData = createGeoJSONData(filteredAgents);

    if (!map.current.getSource('agents-heatmap')) {
      map.current.addSource('agents-heatmap', {
        type: 'geojson',
        data: geoJsonData as any
      });
    }

    if (!map.current.getLayer('agents-heatmap-layer')) {
      map.current.addLayer({
        id: 'agents-heatmap-layer',
        type: 'heatmap',
        source: 'agents-heatmap',
        maxzoom: 15,
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'tsaId'],
            0, 0,
            100000, 1
          ],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, heatmapRadius
          ],
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, heatmapOpacity,
            9, heatmapOpacity * 0.8,
            10, heatmapOpacity * 0.6,
            11, heatmapOpacity * 0.4,
            12, heatmapOpacity * 0.2,
            13, 0
          ]
        }
      }, 'waterway-label');
    }

    console.log(`Added heatmap layer with ${filteredAgents.length} filtered agents`);
  };

  const addAgentMarkers = () => {
    if (!map.current || !dataLoaded || agentData.length === 0) return;

    const filteredAgents = getFilteredAgentData();
    const geoJsonData = createGeoJSONData(filteredAgents);

    if (!map.current.getSource('agents')) {
      map.current.addSource('agents', {
        type: 'geojson',
        data: geoJsonData as any,
        cluster: enableClustering,
        clusterMaxZoom: clusterMaxZoom,
        clusterRadius: clusterRadius
      });
    }

    if (enableClustering && !map.current.getLayer('cluster-count')) {
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'agents',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
    }

    if (!map.current.getLayer('unclustered-point')) {
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'agents',
        filter: enableClustering ? ['!', ['has', 'point_count']] : undefined,
        paint: {
          'circle-color': markerColor,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, markerSize,
            15, markerSize * 2
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 0.6,
            10, 0.8,
            15, 1
          ]
        }
      });
    }

    // Add event handlers only once
    if (!eventListenersAddedRef.current) {
      if (enableClustering) {
        map.current.on('click', 'clusters', (e) => {
          if (isAreaSelectActive) return;
          
          const features = map.current!.queryRenderedFeatures(e.point, {
            layers: ['clusters']
          });

          const clusterId = features[0].properties!.cluster_id;
          (map.current!.getSource('agents') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
              if (err) return;

              map.current!.easeTo({
                center: (features[0].geometry as any).coordinates,
                zoom: zoom ?? undefined
              });
            }
          );
        });

        map.current.on('mouseenter', 'clusters', () => {
          if (!isAreaSelectActive) {
            map.current!.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.current.on('mouseleave', 'clusters', () => {
          if (!isAreaSelectActive) {
            map.current!.getCanvas().style.cursor = '';
          }
        });
      }

      map.current.on('click', 'unclustered-point', (e) => {
        if (isAreaSelectActive) return; 
        
        const coordinates = (e.features![0].geometry as any).coordinates.slice();
        const properties = e.features![0].properties!;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-bold text-lg">${properties.empName}</h3>
              <p class="text-sm text-gray-600">${properties.role}</p>
              <p class="text-sm text-gray-600">${properties.division}</p>
              <p class="text-sm mt-2"><strong>Location:</strong> ${properties.personalAddress}</p>
              <p class="text-xs text-gray-500 mt-1">ID: ${properties.tsaId}</p>
            </div>
          `)
          .addTo(map.current!);
      });

      map.current.on('mouseenter', 'unclustered-point', () => {
        if (!isAreaSelectActive) {
          map.current!.getCanvas().style.cursor = 'pointer';
        }
      });
      
      map.current.on('mouseleave', 'unclustered-point', () => {
        if (!isAreaSelectActive) {
          map.current!.getCanvas().style.cursor = '';
        }
      });

      eventListenersAddedRef.current = true;
    }

    console.log(`Added ${filteredAgents.length} filtered agent markers to map`);
  };

  const toggleLayerVisibility = (layerId: string, visible: boolean) => {
    if (!map.current || !map.current.getLayer(layerId)) return;
    
    map.current.setLayoutProperty(
      layerId,
      'visibility',
      visible ? 'visible' : 'none'
    );
  };

  // initialise map
  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: style,
      center: [initialViewState.longitude, initialViewState.latitude],
      zoom: initialViewState.zoom,
      attributionControl: true
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      
      if (onMapLoad && map.current) {
        onMapLoad(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [accessToken, initialViewState.longitude, initialViewState.latitude, initialViewState.zoom, style, onMapLoad]);

  useEffect(() => {
    if (mapLoaded && dataLoaded && agentData.length > 0) {
      if (showAgentMarkers) {
        addAgentMarkers();
      }
      if (showHeatmap) {
        addHeatmapLayer();
      }
    }
  }, [mapLoaded, dataLoaded, showAgentMarkers, showHeatmap]);

  // update data when filters change
  useEffect(() => {
    if (mapLoaded && dataLoaded && agentData.length > 0) {
      updateDataSources();
    }
  }, [filters, mapLoaded, dataLoaded]);

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className={className}
        style={{ minHeight: '400px' }}
      />
      {(!mapLoaded || ((showAgentMarkers || showHeatmap || isAreaSelectActive) && !dataLoaded)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-gray-600">
            {!mapLoaded ? 'Loading map...' : 'Loading agent data...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapBox;