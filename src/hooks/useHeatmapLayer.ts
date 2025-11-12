/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { AgentData } from '@/types/AgentData';

interface UseHeatmapLayerProps {
  map: mapboxgl.Map | null;
  mapLoaded: boolean;
  dataLoaded: boolean;
  showHeatmap: boolean;
  getFilteredAgentData: () => AgentData[];
  createGeoJSONData: (agents: AgentData[]) => any;
  heatmapRadius?: number;
  heatmapOpacity?: number;
}

export const useHeatmapLayer = ({
  map,
  mapLoaded,
  dataLoaded,
  showHeatmap,
  getFilteredAgentData,
  createGeoJSONData,
  heatmapRadius = 60,
  heatmapOpacity = 0.6
}: UseHeatmapLayerProps) => {

  const toggleLayerVisibility = (layerId: string, visible: boolean) => {
    if (!map || !map.getLayer(layerId)) return;
    
    map.setLayoutProperty(
      layerId,
      'visibility',
      visible ? 'visible' : 'none'
    );
  };

  const updateDataSources = () => {
    if (!map || !mapLoaded || !dataLoaded) return;

    const filteredAgents = getFilteredAgentData();
    const geoJsonData = createGeoJSONData(filteredAgents);

    if (map.getSource('agents-heatmap')) {
      (map.getSource('agents-heatmap') as mapboxgl.GeoJSONSource).setData(geoJsonData as any);
    }
  };

  const addHeatmapLayer = () => {
    if (!map || !dataLoaded) return;

    const filteredAgents = getFilteredAgentData();
    const geoJsonData = createGeoJSONData(filteredAgents);

    if (!map.getSource('agents-heatmap')) {
      map.addSource('agents-heatmap', {
        type: 'geojson',
        data: geoJsonData as any
      });
    }

    if (!map.getLayer('agents-heatmap-layer')) {
      map.addLayer({
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
            100000, 0.1
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
            0.4, 'rgb(103,169,207)',
            0.5, 'rgb(209,229,240)',
            0.7, 'rgb(253,219,199)',
            0.85, 'rgb(239,138,98)',
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

  useEffect(() => {
    if (!mapLoaded || !map) return;

    if (showHeatmap) {
      if (dataLoaded) {
        addHeatmapLayer();
      }
      toggleLayerVisibility('agents-heatmap-layer', true);
    } else {
      toggleLayerVisibility('agents-heatmap-layer', false);
    }
  }, [mapLoaded, showHeatmap, dataLoaded]);

  return {
    addHeatmapLayer,
    updateDataSources,
    toggleLayerVisibility
  };
};