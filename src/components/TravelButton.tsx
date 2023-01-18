import React, { ChangeEvent, useEffect, useState } from "react";
import { house, Room, ViewMode } from "../data/house";
import { Col, Container, Row, Button, ButtonGroup } from "react-bootstrap";
import { determineBestModeAvailable, ViewModeSetter } from "./ViewModeSetter";

export const TravelButton: React.FunctionComponent<{
  target: string;
  mode: ViewMode;
  jump: (r: string, m: ViewMode) => void;
  jumpMode?: ViewMode;
  label?: string;
  children?: React.ReactNode;
  currentRoom: string;
}> = ({ children, target, mode, jump, jumpMode, label, currentRoom, ...props }) => {
  const room = house.rooms[target];
  if (!children) {
    children = label && label.length ? label : room.name;
  }
  jumpMode = jumpMode || determineBestModeAvailable(mode, room);
  return (
    <ButtonGroup>
      <Button size="sm" className="travel-btn" disabled={currentRoom === target && mode === jumpMode} {...props}
        onClick={()=>jump(target, jumpMode || "image")}>
        {children}
      </Button>
      {((room.map !== undefined && room.image !== undefined) || (room.image !== undefined && room.image2 !== undefined)) &&
        <>{room.map !== undefined && <Button size="sm" className="travel-btn" disabled={currentRoom === target && mode === "map" } {...props}
          onClick={()=>jump(target, "map")}>
          M
        </Button>}
        {room.image !== undefined && <Button size="sm" className="travel-btn" disabled={currentRoom === target && mode === "image" } {...props}
          onClick={()=>jump(target, "image")}>
          I
        </Button>}
        {room.image2 !== undefined && <Button size="sm" className="travel-btn" disabled={currentRoom === target && mode === "image2" } {...props}
          onClick={()=>jump(target, "image2")}>
          2
        </Button>}</>
      }
    </ButtonGroup>
  );
};
