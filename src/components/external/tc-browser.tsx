import * as React from "react";
import { useEffect } from "react";
import {
  FxMappingSparkToTone,
  FxMappingToneToSpark,
} from "../../core/fxMapping";
import { Tone } from "../../core/soundshedApi";
import { appViewModel, DeviceViewModelContext } from "../app";
import { Nav, Image, Form } from "react-bootstrap";

import {
  ToneEditStore,
  TonesStateStore,
  UIFeatureToggleStore,
} from "../../core/appViewModel";

import { DeviceStore } from "../../core/deviceViewModel";
import ToneListControl from "../tone-list";
import { PGPresetQuery } from "../../spork/src/devices/spark/sparkAPI";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight, 
  faSearch
} from "@fortawesome/free-solid-svg-icons";

const TcBrowserControl = () => {
  const deviceViewModel = React.useContext(DeviceViewModelContext);

  const favourites = TonesStateStore.useState((s) => s.storedPresets);

  const defaultPageIndex = 1;
  const [pageIndex, setPageIndex] = React.useState(defaultPageIndex);
  const [searchMode, setSearchMode] = React.useState("search");
  const [keyword, setKeyword] = React.useState("");
  const isSearchInProgress =  TonesStateStore.useState((s) => s.isSearchInProgress);

  const isDeviceConnected = DeviceStore.useState((s) => s.isConnected);

  const tcResults = TonesStateStore.useState((s) => s.toneCloudResults);

  useEffect(() => {}, [favourites]);

  const onRefresh = (pageIdx) => {
    let query: PGPresetQuery = { page: pageIdx ?? pageIndex, keyword: keyword };
    appViewModel.loadLatestToneCloudTones(false, query);
  };

  const onSearch = () => {
    setSearchMode("search");
    setPageIndex(defaultPageIndex);
    onRefresh(defaultPageIndex);
  };

  const next = () => {
    let idx = pageIndex + 1;

    setPageIndex(idx);

    if (searchMode == "search") {
      onRefresh(idx);
    } else if (searchMode == "user") {
      createdBy();
    }
  };

  const previous = () => {
    if (pageIndex == defaultPageIndex) return;

    let idx = pageIndex - 1;

    setPageIndex(idx);

    if (searchMode == "search") {
      onRefresh(idx);
    } else if (searchMode == "user") {
      createdBy();
    }
  };

  const createdBy = (userId = "4fa1ffb3727a300001000000") => {
    let idx = pageIndex;
    if (searchMode == "search") {
      // new user search, start at page 1
      idx = defaultPageIndex;

      setPageIndex(idx);
      setSearchMode("user");
    }

    appViewModel.loadToneCloudTonesByUser(userId, idx);
  };

  const onApplyTone = async (tone) => {
    let t = Object.assign({}, tone);
    /*if (!isDeviceConnected) {
          alert("The device is not yet connected, see the Amp tab");
          return;
        }
    */

    if (t.schemaVersion == "pg.preset.summary" && t.fx == null) {
      //need to fetch the preset details
      let result = await appViewModel.loadToneCloudPreset(
        t.toneId.replace("pg.tc.", "")
      );

      if (result != null) {
        //convert xml to json
        let presetData = JSON.parse(result.preset_data);
        let toneData = new FxMappingSparkToTone().mapFrom(presetData);
        Object.assign(t, toneData);
        t.imageUrl = result.thumb_url;
      } else {
        // can't load this tone
        return;
      }
    }

    let p = new FxMappingToneToSpark().mapFrom(t);

    deviceViewModel.requestPresetChange(p);
  };

  return (
    <div className="m2">
      <Form>
        <Form.Group controlId="formSearch">
          <Form.Label>Keyword</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search by keyword"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
            }}
          />
        </Form.Group>
      </Form>
      <button className="btn btn-sm btn-success" onClick={onSearch}>
        Search
      </button>
      <button className="btn btn-sm btn-primary ms-2" onClick={previous}>
        <FontAwesomeIcon icon={faChevronLeft}></FontAwesomeIcon>
      </button>{" "}
      <button className="btn btn-sm btn-primary" onClick={next}>
        <FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>
      </button>

      {isSearchInProgress ? (
      
      <span
        className="spinner-border spinner-border-sm ms-2"
        role="status"
        aria-hidden="true"
      ></span>

   
  ) : (
    ""
  )}
      <button
        className="btn btn-sm btn-secondary float-end"
        onClick={() => {
          createdBy();
        }}
      >
        <FontAwesomeIcon icon={faSearch}></FontAwesomeIcon> PG Tones
      </button>
      <ToneListControl
        toneList={tcResults}
        favourites={favourites}
        onApplyTone={onApplyTone}
        onEditTone={() => {}}
        noneMsg="No PG ToneCloud Results"
        enableToneEditor={false}
      ></ToneListControl>
      <button className="btn btn-sm btn-primary ms-2" onClick={previous}>
        <FontAwesomeIcon icon={faChevronLeft}></FontAwesomeIcon>
      </button>{" "}
      <button className="btn btn-sm btn-primary" onClick={next}>
        <FontAwesomeIcon icon={faChevronRight}></FontAwesomeIcon>
      </button>
    </div>
  );
};

export default TcBrowserControl;
