import { AlertTriangleIcon, CloudDrizzleIcon, ListFilterIcon, MapIcon, MapPinIcon, SearchIcon, VectorSquareIcon } from "lucide-react";
import { useState } from "react";

interface MenuProps {
  handleLocationPinToggle: () => void;
  handleHeatmapToggle: () => void;
  handleAreaSelectToggle: () => void;
  handleFiltersToggle: () => void;
  isAreaSelectActive: boolean;
  isFiltersActive: boolean;
}

const Menu = ({ 
  handleLocationPinToggle, 
  handleHeatmapToggle, 
  handleAreaSelectToggle,
  handleFiltersToggle,
  isAreaSelectActive,
  isFiltersActive
}: MenuProps) => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isLocationPinsActive, setIsLocationPinsActive] = useState(true);
    const [isHeatmapActive, setIsHeatmapActive] = useState(true);
    const [isWeatherActive, setIsWeatherActive] = useState(true);
    const [isAlertsActive, setIsAlertsActive] = useState(true);

    const clickFilters = () => {
        handleFiltersToggle();
        console.log("filters clicked, isFiltersActive:", isFiltersActive);
    }

    const clickSearch = () => {
        setIsSearchActive(!isSearchActive)
        console.log("search clicked");
    }
    
    const clickAreaSelect = () => {
        handleAreaSelectToggle();
        console.log("area select clicked, isAreaSelectActive:", isAreaSelectActive);
    }
    
    const clickLocationPins = () => {
        setIsLocationPinsActive(!isLocationPinsActive)
        handleLocationPinToggle();
    }
    const clickHeatmap = () => {
        setIsHeatmapActive(!isHeatmapActive)
        handleHeatmapToggle();
    }
    const clickWeather = () => {
        setIsWeatherActive(!isWeatherActive)
        console.log("weather clicked");
    }
    const clickAlerts = () => {
        setIsAlertsActive(!isAlertsActive)
        console.log("alerts clicked");
    }

  const menuItems = [
    {
      idx: 0,
      title: "Show Filters",
      icon: <ListFilterIcon />,
      action: clickFilters,
      active: isFiltersActive
        
    },
    {
      idx: 6,
      title: "Area Select",
      icon: <VectorSquareIcon />,
      action: clickAreaSelect,
      active: isAreaSelectActive
    },
    {
      idx: 1,
      title: "Search",
      icon: <SearchIcon />,
      action: clickSearch,
      active: isSearchActive
    },
    {
      idx: 4,
      title: "Show Location Pins",
      icon: <MapPinIcon />,
      action: clickLocationPins,
      active: isLocationPinsActive
    },
    {
      idx: 5,
      title: "Show Heatmap",
      icon: <MapIcon />,
      action: clickHeatmap,
      active: isHeatmapActive
    },
    {
      idx: 2,
      title: "Show Weather Conditions",
      icon: <CloudDrizzleIcon />,
      action: clickWeather,
      active: isWeatherActive
    },
    {
      idx: 3,
      title: "Show Emergency Alerts",
      icon: <AlertTriangleIcon />,
      action: clickAlerts,
      active: isAlertsActive
    },
  ];

  return (
    <div>
      <div className="bg-black/90 p-2 rounded-full flex items-center">
        {menuItems.map((item) => (
          <div key={item.idx} className="flex items-center justify-center gap-x-4">
            <button 
              onClick={item.action} 
              className={`aspect-square w-8 flex items-center justify-center hover:text-neutral-50 hover:scale-110 transition cursor-pointer relative ${
                item.active ? 'text-blue-400' : 'text-neutral-400'
              }`}
              title={item.title}
            >
              {item.icon}
            </button>
          </div>
        ))}
      </div>
      {isAreaSelectActive && (
        <div className="absolute bottom-16 mt-2 bg-black/90 p-2 rounded-lg text-white text-sm text-center">
          Click points on the map to draw an area, then double-click to finish
        </div>
      )}
    </div>
  );
};

export default Menu;