import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import { Room, ViewMode } from "../data/house";

export function determineBestModeAvailable(mode: ViewMode, room: Room): ViewMode {
  let bestModeAvailable: ViewMode = mode;
  if (bestModeAvailable === "image2" && room.image2 === undefined) {
    bestModeAvailable = "image";
  }
  if (bestModeAvailable === "image" && room.image === undefined) {
    bestModeAvailable = "map";
  }
  if (bestModeAvailable === "map" && room.map === undefined) {
    bestModeAvailable = "image";
  }
  return bestModeAvailable;
}

export function ViewModeSetter({
  title, room, mode, setMode
}: {
  title: string;
  room: Room;
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
}): JSX.Element {
  const hasMap = room.map !== undefined;
  const hasImage = room.image !== undefined;
  const hasSecondImage = room.image2 !== undefined;
  mode = determineBestModeAvailable(mode, room);  

  function changeMode(newMode: ViewMode) {
    setMode(newMode);
  }

  return (
    <>
      <ToggleButtonGroup type="radio" name={`${title}-view-mode-options`} value={mode} onChange={changeMode}>
        {hasMap && 
          <ToggleButton id={`${title}-tbg-radio-map`} value="map">
            Map
          </ToggleButton>
        }
        {hasImage && 
          <ToggleButton id={`${title}-tbg-radio-image`} value="image">
            Image
          </ToggleButton>
        }
        {hasSecondImage && 
          <ToggleButton id={`${title}-tbg-radio-image2`} value="image2">
            Image 2
          </ToggleButton>
        }
      </ToggleButtonGroup>
    </>
  );
}
