import React, { ChangeEvent, useCallback, useEffect, useState, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";
import Form from 'react-bootstrap/Form';
import { Col, Container, Row, Button } from "react-bootstrap";
import { house, MISSING_IMAGE, Room, ViewMode } from "./data/house";
import { RoomPreview } from "./components/RoomPreview";
import { determineBestModeAvailable } from "./components/ViewModeSetter";
import { TravelButton } from "./components/TravelButton";
import { ItemButton } from "./components/ItemButton";

const ITEM_MAP: Record<string, string> = {};
const GLOBAL_ITEMS: string[] = [
  "brother", "sister", "father", "mother", 
];

Object.entries(house.rooms).forEach(([name, room]: [string, Room]) => {
  room.items.forEach((item: string) => {
    ITEM_MAP[item] = `${name}-show-${item}.jpg`;
  });
});

function App() {
  const [playerRoom, setPlayerRoom] = useState<string>("livingroom");
  const [viewingRoom, setViewingRoom] = useState<string>("livingroom");
  const [playerHistory, setPlayerHistory] = useState<string[]>(["livingroom"]);
  const [viewingHistory, setViewingHistory] = useState<string[]>([
    "livingroom",
  ]);
  const [playerMode, setPlayerMode] = useState<ViewMode>("image");
  const [viewingMode, setViewingMode] = useState<ViewMode>("map");
  const [itemStack, setItemStack] = useState<string[]>([]);
  const [rotation, setRotation] = useState<number>(0);
  const [jumpWithFocus, setJumpWithFocus ] = useState<boolean>(true);
  var [display, setDisplay] = useState<Window | null>(null);
  const playerImageRef = useRef<HTMLImageElement | null>(null);

  const updatePreviewWindow = useCallback(
    (image: string) => {
      if (display) {
        display.document.body.innerHTML = "";
        display.document.write(
          `<div style="text-align: center;">${image}</div>`
        );
        display.document.body.style.background = "black";
        display.document.body.style.height = "100%";
        const img = display.document.querySelector("img");
        if (img) {
          img.onclick = function (evt: MouseEvent) {
            if (
              display?.document.body === display?.document.fullscreenElement
            ) {
              display?.document.exitFullscreen();
            } else {
              display?.document.body.requestFullscreen();
            }
          };
        }
        display.onbeforeunload = ()=> setDisplay(null);
      }
    },
    [display]
  );

  function rotate(amount: number) {
    setRotation((rotation + amount) % 360);
  }

  useEffect(() => {
    let filename = MISSING_IMAGE;
    if (itemStack.length > 0) {
      const shownItem = itemStack[0];
      if (GLOBAL_ITEMS.includes(shownItem)) {
        filename = `${shownItem}.jpg`;
      } else {
        filename = ITEM_MAP[shownItem];
      }
    } else {
      const room = house.rooms[playerRoom];
      const shownMode = determineBestModeAvailable(playerMode, room);
      filename = room[shownMode];
    }
    if (filename === undefined) {
      filename = MISSING_IMAGE;
    }
    const img = `<img src="house_images/${filename}" height="100%" style="transform: rotate(${rotation}deg)">`;
    updatePreviewWindow(img);
  }, [
    display,
    playerRoom,
    playerMode,
    updatePreviewWindow,
    itemStack,
    rotation,
  ]);

  useEffect(() => {
    if (jumpWithFocus) {
      playerImageRef?.current?.scrollIntoView();
    }
  }, [playerRoom, playerMode]);

  function showItem(item: string) {
    if (!itemStack.includes(item)) {
      setItemStack([item, ...itemStack]);
    }
  }

  function closeItem(item: string) {
    setItemStack(itemStack.filter((potential: string) => item !== potential));
  }

  async function launch() {
    const newDisplay = window.open("", "", "resizable");
    if (newDisplay) {
      newDisplay.document.body.style.background = "black";
    }
    setDisplay(newDisplay);
  }

  function moveToRoom(target?: string, mode: ViewMode = "image") {
    if (target == null) {
      target = viewingRoom;
    }
    if (
      target !== undefined &&
      (playerRoom !== target || playerMode !== mode)
    ) {
      setPlayerRoom(target);
      setPlayerMode(mode);
      if (playerRoom !== target) {
        setPlayerHistory([target, ...playerHistory]);
      }
    }
  }

  function previewRoom(target: string, mode: ViewMode = "image") {
    if (viewingRoom !== target || viewingMode !== mode) {
      setViewingRoom(target);
      setViewingMode(mode);
      if (viewingRoom !== target) {
        setViewingHistory([target, ...viewingHistory]);
      }
    }
  }

  return (
    <Container className="App">
      <Row>
        <Col xs={true} sm={true}>
          <RoomPreview
            key={viewingRoom}
            roomKey={viewingRoom}
            room={house.rooms[viewingRoom]}
            title="Viewing Room"
            setRoom={previewRoom}
            history={viewingHistory}
            clear={() => setViewingHistory([])}
            showItem={showItem}
            closeItem={closeItem}
            itemStack={itemStack}
            mode={viewingMode}
            setMode={setViewingMode}
          ></RoomPreview>
        </Col>
        <Col>
          <h1>Global Controls</h1>
          <div>
            <Button onClick={launch} className="btn btn-primary" variant={display === null ? "success" : "default"}>
              {display === null ? "Launch Display" : "Display already launched (launch again)"}
            </Button>
          </div>

          <div>
            Rotate:
            <Button onClick={() => rotate(90)}>↻</Button>
            <Button onClick={() => rotate(-rotation)}>Reset</Button>
            <Button onClick={() => rotate(-90)}>↺</Button>
          </div>

          <div>
            Move Players to &rarr;
            <TravelButton
              target={viewingRoom}
              jump={moveToRoom}
              currentRoom={playerRoom}
              mode={playerMode}
              jumpMode={viewingMode}></TravelButton>
          </div>

          <div>
            Change Viewing Room to &larr;
            <TravelButton
              target={playerRoom}
              jump={previewRoom}
              currentRoom={viewingRoom}
              mode={viewingMode}
              jumpMode={playerMode}></TravelButton>
          </div>

          {itemStack.length > 0 && (
            <div>Opened Items:
              <ol>
                {itemStack.map((item: string, index: number) => {
                  return (
                    <li key={item}>
                      <ItemButton
                        key={item}
                        item={item}
                        itemStack={itemStack}
                        showItem={showItem}
                        closeItem={closeItem}
                      ></ItemButton>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
          <div>
            Global Items:
            { GLOBAL_ITEMS.map((item: string) =>
              <ItemButton
                key={item}
                item={item}
                itemStack={itemStack}
                showItem={showItem}
                closeItem={closeItem}
              ></ItemButton>)}
          </div>
          
          <div>
            Emergency Warp Players to:
            <ul>
              {["livingroom", "fountainofpain"].map((specialRoom: string) => (
                <li key={specialRoom}>
                  <TravelButton
                    target={specialRoom}
                    jump={moveToRoom}
                    currentRoom={playerRoom}
                    mode={playerMode}
                  ></TravelButton>
                </li>
              ))}
            </ul>
          </div>

          <div>
            Settings:
            <Form.Check 
              type="switch"
              label="Jump with focus"
              checked={jumpWithFocus}
              onChange={(evt)=>setJumpWithFocus(evt.target.checked)}
            />
          </div>
        </Col>
        <Col>
          <RoomPreview
            key={playerRoom}
            roomKey={playerRoom}
            room={house.rooms[playerRoom]}
            title="Player Room"
            setRoom={moveToRoom}
            history={playerHistory}
            clear={() => setPlayerHistory([])}
            showItem={showItem}
            closeItem={closeItem}
            itemStack={itemStack}
            mode={playerMode}
            setMode={setPlayerMode}
            imageRef={playerImageRef}
          ></RoomPreview>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
