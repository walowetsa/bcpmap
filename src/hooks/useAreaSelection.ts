/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { AgentData } from '@/types/AgentData';

interface UseAreaSelectionProps {
  map: mapboxgl.Map | null;
  isAreaSelectActive: boolean;
  onAreaSelected?: (agents: AgentData[]) => void;
  getFilteredAgentData: () => AgentData[];
}

export const useAreaSelection = ({
  map,
  isAreaSelectActive,
  onAreaSelected,
  getFilteredAgentData
}: UseAreaSelectionProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<number[][]>([]);
  const [completedPolygon, setCompletedPolygon] = useState<number[][] | null>(null);
  const drawingHandlersRef = useRef<any>({});
  const onAreaSelectedRef = useRef(onAreaSelected);

  useEffect(() => {
    onAreaSelectedRef.current = onAreaSelected;
  }, [onAreaSelected]);

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
    if (!map || coordinates.length < 3) return;

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

    if (map.getSource('selection-polygon')) {
      map.removeLayer('selection-polygon-fill');
      map.removeLayer('selection-polygon-outline');
      map.removeSource('selection-polygon');
    }

    map.addSource('selection-polygon', {
      type: 'geojson',
      data: polygonGeoJSON as any
    });

    map.addLayer({
      id: 'selection-polygon-fill',
      type: 'fill',
      source: 'selection-polygon',
      paint: {
        'fill-color': '#3B82F6',
        'fill-opacity': 0.2
      }
    });

    map.addLayer({
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
    if (!map || coordinates.length === 0) return;

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

    if (map.getSource('drawing-points')) {
      map.removeLayer('drawing-points');
      map.removeSource('drawing-points');
    }

    map.addSource('drawing-points', {
      type: 'geojson',
      data: pointsGeoJSON as any
    });

    map.addLayer({
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

      if (map.getSource('drawing-line')) {
        map.removeLayer('drawing-line');
        map.removeSource('drawing-line');
      }

      map.addSource('drawing-line', {
        type: 'geojson',
        data: lineGeoJSON as any
      });

      map.addLayer({
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
    if (!map) return;

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
      if (map?.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    sourcesToRemove.forEach(sourceId => {
      if (map?.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });
  };

  useEffect(() => {
    if (completedPolygon && onAreaSelectedRef.current) {
      const agentsInPolygon = filterAgentsInPolygon(completedPolygon);
      onAreaSelectedRef.current(agentsInPolygon);
      setCompletedPolygon(null);
    }
  }, [completedPolygon]);

  // handle area selection activation/deactivation
  useEffect(() => {
    if (!map) return;

    if (isAreaSelectActive) {
      setIsDrawing(true);
      setPolygonCoordinates([]);
      map.getCanvas().style.cursor = 'crosshair';

      const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        if (!isAreaSelectActive) return;
        
        const clickCoords = [e.lngLat.lng, e.lngLat.lat];
        
        setPolygonCoordinates(prev => {
          const newCoords = [...prev, clickCoords];
          addDrawingPointsToMap(newCoords);
          return newCoords;
        });
      };

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
          if (map) {
            map.getCanvas().style.cursor = '';
          }
          
          setCompletedPolygon(currentCoords);
          
          return currentCoords;
        });
      };

      drawingHandlersRef.current.click = handleMapClick;
      drawingHandlersRef.current.dblclick = handleMapDoubleClick;

      map.on('click', handleMapClick);
      map.on('dblclick', handleMapDoubleClick);

    } else {
      setIsDrawing(false);
      setPolygonCoordinates([]);
      setCompletedPolygon(null);
      if (map) {
        map.getCanvas().style.cursor = '';
      }
      
      if (drawingHandlersRef.current.click) {
        map.off('click', drawingHandlersRef.current.click);
      }
      if (drawingHandlersRef.current.dblclick) {
        map.off('dblclick', drawingHandlersRef.current.dblclick);
      }
      
      clearDrawingLayers();
    }

    return () => {
      if (map && drawingHandlersRef.current.click) {
        map.off('click', drawingHandlersRef.current.click);
      }
      if (map && drawingHandlersRef.current.dblclick) {
        map.off('dblclick', drawingHandlersRef.current.dblclick);
      }
    };
  }, [isAreaSelectActive, map]);

  return {
    isDrawing,
    polygonCoordinates,
    clearDrawingLayers
  };
};