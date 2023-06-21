import React, { ChangeEvent, useCallback, useEffect, useState, useRef } from "react";
import logo from "./logo.svg";
import "./App.css";
import NewWindow from 'react-new-window'
import Form from 'react-bootstrap/Form';
import { Col, Container, Row, Button, FloatingLabel } from "react-bootstrap";
import { house, MISSING_IMAGE, Region, Room, ViewMode } from "./data/house";
import { RoomPreview } from "./components/RoomPreview";
import { determineBestModeAvailable } from "./components/ViewModeSetter";
import { TravelButton } from "./components/TravelButton";
import { ItemButton } from "./components/ItemButton";
import { AltMapOverview, makeMapOverview } from "./components/AltMapOverview";
import cytoscape from "cytoscape";

const VISITED_NODES_LS_KEY = 'ADVENTURE-CONTROLLER-VISITED';
const SAVED_VISITED_NODES = JSON.parse(localStorage.getItem(VISITED_NODES_LS_KEY) || "{}");

const CYTOSCAPE_EMBEDS = [
  `<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.23.0/cytoscape.min.js"></script>`,
  `<script src="https://unpkg.com/weaverjs@1.2.0/dist/weaver.min.js"></script>`,
  `<script src="https://cdn.jsdelivr.net/npm/cytoscape-spread@3.0.0/cytoscape-spread.min.js"></script>`,
  `<script src="https://unpkg.com/layout-base/layout-base.js"></script>`,
  `<script src="https://unpkg.com/cose-base/cose-base.js"></script>`,
  `<script src="https://unpkg.com/cytoscape-layout-utilities/cytoscape-layout-utilities.js"></script>`,
  `<script src="https://cdn.jsdelivr.net/npm/cytoscape-fcose@2.2.0/cytoscape-fcose.min.js"></script>`
  // `<script src="https://unpkg.com/webcola/WebCola/cola.min.js"></script>`,
  // `<script src="https://cdn.jsdelivr.net/npm/cytoscape-cola@2.4.0/cytoscape-cola.min.js"></script>`
];

const ITEM_MAP: Record<string, string> = {};
const GLOBAL_ITEMS: string[] = [
  "brother", "sister", "father", "mother", "cultist", "dress", "sanderson", "lacuna.mp4"
];

Object.entries(house.rooms).forEach(([name, room]: [string, Room]) => {
  room.items.forEach((item: string) => {
    ITEM_MAP[item] = `${name}-show-${item}.jpg`;
  });
});

function resetDisplay(display: Window, contents: string) {
  display.document.body.innerHTML = "";
  display.document.head.innerHTML = "";
  const head = display.document.getElementsByTagName("head")[0];
  CYTOSCAPE_EMBEDS.forEach((embedScript: string) => {
    head.append(display.document.createRange().createContextualFragment(embedScript));
  });
  display.document.write(
    `<div style="position: relative;" id="main">${contents}</div>`
  );
  display.document.body.style.background = "black";
  display.document.body.style.height = "100%";
}

function toggleFullscreen(display: Window) {
  return function (evt: MouseEvent) {
    if (
      display?.document.body === display?.document.fullscreenElement
    ) {
      display?.document.exitFullscreen();
    } else {
      display?.document.body.requestFullscreen();
    }
  };
}

export type PREVIEW_TYPE = "image" | "map" | "video";


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
  const [skipInitialJump, setSkipInitialJump] = useState<boolean>(true);
  var [display, setDisplay] = useState<Window | null>(null);
  const playerImageRef = useRef<HTMLImageElement | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<Record<string, boolean>>(SAVED_VISITED_NODES);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapFilter, setMapFilter] = useState<string>("");

  useEffect(() => {
    localStorage.setItem(VISITED_NODES_LS_KEY, JSON.stringify(visitedNodes));
  }, [visitedNodes]);

  const visit = useCallback((room: string, visited: boolean) => {
    setVisitedNodes({...visitedNodes, [room]: visited})
  }, [visitedNodes, setVisitedNodes]);

  const setMapFilters = useCallback((evt: ChangeEvent<HTMLSelectElement>) => {
    setMapFilter(evt.target.value);
  }, [setMapFilter]);

  const updatePreviewWindow = useCallback(
    (image: string, tag: string) => {
      if (display) {
        resetDisplay(display, image);
        const mainBody = display.document.getElementById('main');
        if (mainBody) {
          mainBody.style.textAlign = "center";
        }
        const img = display.document.querySelector(tag) as HTMLImageElement;
        if (img) {
          img.onclick = toggleFullscreen(display);
        }
        display.onbeforeunload = ()=> {
          setDisplay(null);
          setShowMap(false);
        };
      }
    },
    [display]
  );
  const showMapPreviewWindow = useCallback(()=>{
    if (display) {
      resetDisplay(display, "");
      const mainBody = display.document.getElementById('main');
      if (mainBody) {
        mainBody.style.width = "100%";
        mainBody.style.height = "100%";
        const mapJson = JSON.stringify(makeMapOverview(visitedNodes, mapFilter));
        display.document.write(`<script>
          cytoscape.use(cytoscapeSpread);
          cy = cytoscape({
            container: document.getElementById('main'),
            ...${mapJson}
          });
        </script>`);
      }
      // const img = display.document.querySelector("img");
      // if (img) {
      //   img.onclick = toggleFullscreen(display);
      // }
      display.onbeforeunload = ()=> {
        setDisplay(null);
        setShowMap(false);
      };
    }
  }, [display, setDisplay, visitedNodes, mapFilter]);

  function rotate(amount: number) {
    setRotation((rotation + amount) % 360);
  }

  useEffect(() => {
    if (showMap) {
      return showMapPreviewWindow();
    }
    let filetype: PREVIEW_TYPE = "image";
    let filename = MISSING_IMAGE;
    if (itemStack.length > 0) {
      const shownItem = itemStack[0];
      if (GLOBAL_ITEMS.includes(shownItem)) {
        if (shownItem.endsWith(".mp4")) {
          filename = shownItem;
          filetype = "video";
        } else {
          filename = `${shownItem}.jpg`;
        }
      } else if (shownItem.startsWith("backrooms-0")) {
        filename = `backrooms/${shownItem}.jpeg`;
      } else {
        filename = ITEM_MAP[shownItem];
      }
    } else {
      const room = house.rooms[playerRoom];
      const shownMode = determineBestModeAvailable(playerMode, room);
      filename = room[shownMode];
      if (filename && filename.endsWith(".mp4")) {
        filetype = "video";
      }
    }
    if (filename === undefined) {
      filename = MISSING_IMAGE;
    }
    switch (filetype) {
      case "video":
        updatePreviewWindow(`<video autoplay loop muted src="house_images/${filename}" height="100%" style="transform: rotate(${rotation}deg)"></video>`, "video");
        break;
      case "image": default:
        updatePreviewWindow(`<img src="house_images/${filename}" height="100%" style="transform: rotate(${rotation}deg)">`, "img");
        break;
    }
  }, [
    display,
    playerRoom,
    playerMode,
    updatePreviewWindow,
    itemStack,
    rotation,
    showMap,
    visitedNodes,
    showMapPreviewWindow,
    mapFilter
  ]);

  useEffect(() => {
    if (jumpWithFocus && !skipInitialJump) {
      playerImageRef?.current?.scrollIntoView();
    }
    setSkipInitialJump(false);
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
      {/* <Row>
        <Col>
          <AltMapOverview visitedNodes={visitedNodes}></AltMapOverview>
        </Col>
      </Row> */}
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
            visit={visit}
            visited={visitedNodes[viewingRoom]}
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
          <Row className="justify-content-md-center align-items-center">
            <Col md="auto">
            <Button variant={showMap ? "success" : "primary"}
              onClick={()=>setShowMap(!showMap)}
              disabled={display===null}
            >{showMap ? "Hide Map" : "Show Map"}</Button>
            </Col>
            <Col>
            <FloatingLabel controlId="mapFilters" label="Filter Map">
              <Form.Select onChange={setMapFilters}>
                <option value="" key="BLANK"></option>
                {Object.entries(house.regions).map(
                  ([key, region]: [string, Region]) => (
                    <option value={key} key={key}>
                      {region.name}
                    </option>
                  )
                )}
              </Form.Select>
            </FloatingLabel>
            </Col>
          </Row>
          
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
            visit={visit}
            visited={visitedNodes[playerRoom]}
          ></RoomPreview>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
