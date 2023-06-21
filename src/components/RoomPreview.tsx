import React, { ChangeEvent, useEffect, useState } from "react";
import { house, Room, ViewMode, sortRoomsByPage } from "../data/house";
import Form from "react-bootstrap/Form";
import { Col, Container, Row, Button } from "react-bootstrap";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import { determineBestModeAvailable, ViewModeSetter } from "./ViewModeSetter";
import { TravelButton } from "./TravelButton";
import { ItemButton } from "./ItemButton";

const PUBLIC_FILE_URL = "https://liveapp213.thedarkesthouse.com/public_files/";

export function RoomPreview({
  roomKey,
  title,
  room,
  setRoom,
  history,
  clear,
  showItem,
  closeItem,
  itemStack,
  mode,
  setMode,
  imageRef,
  visit,
  visited
}: {
  roomKey: string;
  title: string;
  room: Room;
  setRoom: (r: string) => void;
  history: string[];
  clear: () => void;
  showItem: (item: string) => void;
  closeItem: (item: string) => void;
  itemStack: string[];
  mode: ViewMode;
  setMode: (m: ViewMode) => void;
  imageRef?: React.MutableRefObject<HTMLImageElement | null>
  visit: (room: string, visited: boolean) => void
  visited: boolean
}): JSX.Element {
  function jumpToRoom(evt: ChangeEvent<HTMLSelectElement>) {
    const room = evt.target.value;
    setRoom(room);
  }

  const shownMode = determineBestModeAvailable(mode, room);

  return (
    <div>
      <h1
        ref={imageRef !== undefined ? imageRef : null}>{title}</h1>
        {
          room[shownMode] && room[shownMode].endsWith(".mp4") ?
            <video src={`house_images/${room[shownMode]}`}
            className="room-preview"></video> :
            <img
              src={`house_images/${room[shownMode]}`}
              className="room-preview"
              alt={title + " preview"}
            />
        }
      <div>
        Page {room.id} (<code>{roomKey}</code>):
        <Button
          variant={visited ? "success" : "outline-light"}
          onClick={()=>visit(roomKey, !visited)}
        >{visited ? "Visited" : "Mark Visited"}</Button>
      </div>
      <ViewModeSetter
        title={title}
        room={room}
        mode={mode}
        setMode={setMode}
      ></ViewModeSetter>
      {room.items.length > 0 && (
        <div>
          Items:<br></br>
            {room.items.map((item: string) => (
              <ItemButton
                key={item}
                item={item}
                itemStack={itemStack}
                showItem={showItem}
                closeItem={closeItem}
              ></ItemButton>
            ))}
        </div>
      )}
      {room.sounds && room.sounds.length > 0 && (
        <div>
          Sounds:<br></br>
            {room.sounds.map((song: string) => (
              <audio
                key={song}
                controls
              ><source
                src={song.startsWith("http") ? song : PUBLIC_FILE_URL + song} type="audio/wav">
              </source></audio>
            ))}
        </div>
      )}
      <div>
        {room.doors.length > 0 && (
          <>
            Doors:
            <ul>
              {room.doors.map((door: string) => (
                <li key={door}>
                  <TravelButton
                    target={door}
                    jump={setRoom}
                    currentRoom={roomKey}
                    mode={mode}
                  ></TravelButton>
                </li>
              ))}
            </ul>
          </>
        )}
        {room.warps.length > 0 && (
          <>
            Warps:
            <ul>
              {room.warps.map((warp: string) => (
                <li key={warp}>
                  <TravelButton
                    target={warp}
                    jump={setRoom}
                    currentRoom={roomKey}
                    mode={mode}
                  ></TravelButton>
                </li>
              ))}
            </ul>
          </>
        )}
        <div>
            <FloatingLabel controlId="jumpToRoom" label="Jump to Room:">
              <Form.Select onChange={jumpToRoom}>
                {Object.entries(house.rooms).map(
                  ([key, room]: [string, Room]) => (
                    <option value={key} key={key}>
                      {room.name}
                    </option>
                  )
                )}
              </Form.Select>
            </FloatingLabel>
          <FloatingLabel controlId="jumpToPage" label="Jump to Page:">
            <Form.Select onChange={jumpToRoom}>
              {Object.entries(house.rooms)
                .sort(sortRoomsByPage)
                .map(([key, room]: [string, Room]) => (
                  <option value={key} key={key}>
                    ({room.id}) {room.name}
                  </option>
                ))}
            </Form.Select>
            </FloatingLabel>
            </div>
        Room History{" "}
        <Button
          variant="danger"
          onClick={() => window.confirm("Are you sure?") && clear()}
          size="sm"
        >
          Clear
        </Button>
        :
        <ol style={{ maxHeight: "300px", overflow: "auto" }}>
          {history.map((pastRoom: string, index: number) => {
            return (
              <li key={index}>
                <TravelButton
                  key={pastRoom}
                  jump={setRoom}
                  target={pastRoom}
                  currentRoom={roomKey}
                  mode={mode}
                ></TravelButton>
                {/* <Button
                  key={pastRoom}
                  onClick={() => setRoom(pastRoom)}
                  size="sm"
                  className="travel-btn"
                  disabled={pastRoom === roomKey}
                >
                  {house.rooms[pastRoom].name}
                </Button> */}
              </li>
            );
          })}
        </ol>
        { roomKey === "backrooms" &&
          <div>
            Backrooms:<br></br>
            {["01","02","03","04","05","06","07","08","09","10",
              "11", "12", "13", "14", "15", "16", "17", "18", "19",
            "20", "21", "22", "23", "24", "25", "26", "27", "28",
          "29", "30"].map((backroom: string) => (
              <ItemButton
                key={backroom}
                item={"backrooms-0"+backroom}
                itemStack={itemStack}
                showItem={showItem}
                closeItem={closeItem}
              ></ItemButton>
            ))}
          </div>}
      </div>
    </div>
  );
}
