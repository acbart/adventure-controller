import React, { ChangeEvent, useEffect, useState } from "react";
import { house, Room, ViewMode } from "../data/house";
import { Col, Container, Row, Button, ButtonGroup } from "react-bootstrap";
import { determineBestModeAvailable, ViewModeSetter } from "./ViewModeSetter";

export const ItemButton: React.FunctionComponent<{
  item: string;
  itemStack: string[];
  showItem: (item: string)=>void;
  closeItem: (item: string)=>void;
  label?: string;
  children?: React.ReactNode;
}> = ({ item, itemStack, showItem, closeItem, label, children,  ...props }) => {
  if (!children) {
    children = label && label.length ? label : item;
  }

  if (itemStack.includes(item)) {
    return <Button
      onClick={() => closeItem(item)}
      size="sm"
      variant="danger"
      className="travel-btn"
    >
      {item}
    </Button>
  } else {
    return <Button
      onClick={() => showItem(item)}
      size="sm"
      className="travel-btn"
    >
      {item}
    </Button>;
  }
}