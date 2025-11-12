/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { AgentData } from '@/types/AgentData';

interface UseAgentMarkersProps {
  map: mapboxgl.Map | null;
  mapLoaded: boolean;
  dataLoaded: boolean;
  showAgentMarkers: boolean;
  isAreaSelectActive: boolean;
  getFilteredAgentData: () => AgentData[];
  createGeoJSONData: (agents: AgentData[]) => any;
  markerColor?: string;
  markerSize?: number;
  enableClustering?: boolean;
  clusterRadius?: number;
  clusterMaxZoom?: number;
}

export const useAgentMarkers = ({
  map,
  mapLoaded,
  dataLoaded,
  showAgentMarkers,
  isAreaSelectActive,
  getFilteredAgentData,
  createGeoJSONData,
  markerColor = '#3B82F6',
  markerSize = 8,
  enableClustering = true,
  clusterRadius = 50,
  clusterMaxZoom = 14
}: UseAgentMarkersProps) => {
  const eventListenersAddedRef = useRef(false);

  const toggleLayerVisibility = (layerId: string, visible: boolean) => {
    if (!map || !map.getLayer(layerId)) return;
    
    map.setLayoutProperty(
      layerId,
      'visibility',
      visible ? 'visible' : 'none'
    );
  };

  const removeAgentLayers = () => {
    if (!map) return;

    const layersToRemove = ['clusters', 'cluster-count', 'unclustered-point'];
    const sourcesToRemove = ['agents'];

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

    eventListenersAddedRef.current = false;
  };

  const updateDataSources = () => {
    if (!map || !mapLoaded || !dataLoaded) return;

    const filteredAgents = getFilteredAgentData();
    const geoJsonData = createGeoJSONData(filteredAgents);

    console.log(`Updating map with ${filteredAgents.length} filtered agents`);

    if (map.getSource('agents')) {
      (map.getSource('agents') as mapboxgl.GeoJSONSource).setData(geoJsonData as any);
    }
  };

  const addAgentMarkers = () => {
    if (!map || !dataLoaded) return;

    const filteredAgents = getFilteredAgentData();
    const geoJsonData = createGeoJSONData(filteredAgents);

    if (!map.getSource('agents')) {
      map.addSource('agents', {
        type: 'geojson',
        data: geoJsonData as any,
        cluster: enableClustering,
        clusterMaxZoom: clusterMaxZoom,
        clusterRadius: clusterRadius
      });
    }

    if (enableClustering && !map.getLayer('clusters')) {
      map.addLayer({
        id: 'clusters',
        type: 'symbol',
        source: 'agents',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });
    }

    if (enableClustering && !map.getLayer('cluster-count')) {
      map.addLayer({
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

    if (!map.getLayer('unclustered-point')) {
      map.addLayer({
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

    if (!eventListenersAddedRef.current) {
      if (enableClustering) {
        map.on('click', 'clusters', (e) => {
          if (isAreaSelectActive) return;
          
          const features = map!.queryRenderedFeatures(e.point, {
            layers: ['clusters']
          });

          const clusterId = features[0].properties!.cluster_id;
          (map!.getSource('agents') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
              if (err) return;

              map!.easeTo({
                center: (features[0].geometry as any).coordinates,
                zoom: zoom ?? undefined
              });
            }
          );
        });

        map.on('mouseenter', 'clusters', () => {
          if (!isAreaSelectActive) {
            map!.getCanvas().style.cursor = 'pointer';
          }
        });
        
        map.on('mouseleave', 'clusters', () => {
          if (!isAreaSelectActive) {
            map!.getCanvas().style.cursor = '';
          }
        });
      }

      map.on('click', 'unclustered-point', (e) => {
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
          .addTo(map!);
      });

      map.on('mouseenter', 'unclustered-point', () => {
        if (!isAreaSelectActive) {
          map!.getCanvas().style.cursor = 'pointer';
        }
      });
      
      map.on('mouseleave', 'unclustered-point', () => {
        if (!isAreaSelectActive) {
          map!.getCanvas().style.cursor = '';
        }
      });

      eventListenersAddedRef.current = true;
    }

    console.log(`Added ${filteredAgents.length} filtered agent markers to map`);
  };

  useEffect(() => {
    if (!mapLoaded || !map) return;

    if (showAgentMarkers) {
      if (dataLoaded) {
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
  }, [mapLoaded, showAgentMarkers, dataLoaded]);

  return {
    addAgentMarkers,
    removeAgentLayers,
    updateDataSources,
    toggleLayerVisibility
  };
};