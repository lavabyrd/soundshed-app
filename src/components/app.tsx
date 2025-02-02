import { faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "bootstrap/dist/css/bootstrap.min.css";
import * as React from "react";
import { useEffect } from "react";
import { Button } from "react-bootstrap";
import * as ReactDOM from "react-dom";
import {
  HashRouter as Router,
  NavLink,
  Route,
  Switch,
  useHistory,
} from "react-router-dom";
import "../../css/styles.css";
import AppViewModel, {
  AppStateStore,
  UIFeatureToggleStore,
} from "../core/appViewModel";
import DeviceViewModel, { DeviceStore } from "../core/deviceViewModel";
import { LessonManager } from "../core/lessonManager";
import { Login, UserRegistration } from "../core/soundshedApi";
import AboutControl from "./about";
import DeviceMainControl from "./device/device-main";
import DeviceSelectorControl from "./device/device-selector";
import HomeControl from "./home";
import LessonsControl from "./lessons";
import AmpOfflineControl from "./soundshed/amp-offline";
import EditToneControl from "./soundshed/edit-tone";
import LoginControl from "./soundshed/login";
import ToneBrowserControl from "./tone-browser";

export const appViewModel: AppViewModel = new AppViewModel();
export const deviceViewModel: DeviceViewModel = new DeviceViewModel();
export const lessonManager: LessonManager = new LessonManager();

// export context providers for view models
export const AppViewModelContext = React.createContext(appViewModel);
export const DeviceViewModelContext = React.createContext(deviceViewModel);

const App = () => {
  const history = useHistory();

  useEffect(() => {
    return history?.listen((location) => {
      console.log(`Navigated the page to: ${location.pathname}`);
      appViewModel.logPageView(location.pathname);
    });
  }, [history]);

  const isNativeMode = AppStateStore.useState((s) => s.isNativeMode);
  const isUserSignedIn = AppStateStore.useState((s) => s.isUserSignedIn);

  const signInRequired = AppStateStore.useState((s) => s.isSignInRequired);

  const userInfo = AppStateStore.useState((s) => s.userInfo);

  const isConnected = DeviceStore.useState((s) => s.isConnected);

  const requireSignIn = async () => {
    AppStateStore.update((s) => {
      s.isSignInRequired = true;
    });
  };

  const performSignIn = (login: Login) => {
    return appViewModel.performSignIn(login).then((loggedInOk) => {
      if (loggedInOk == true) {
        AppStateStore.update((s) => {
          s.isSignInRequired = false;
        });
      }

      return loggedInOk;
    });
  };

  const performRegistration = (reg: UserRegistration) => {
    return appViewModel.performRegistration(reg).then((loggedInOk) => {
      if (loggedInOk == true) {
        AppStateStore.update((s) => {
          s.isSignInRequired = false;
        });
      }

      return loggedInOk;
    });
  };

  const performSignOut = () => {
    appViewModel.signOut();
  };

  // perform startup
  useEffect(() => {
    console.log("App startup..");

    const lastKnownDevices = deviceViewModel.getLastKnownDevices();
    if (lastKnownDevices.length > 0) {
      DeviceStore.update((s) => {
        s.devices = lastKnownDevices;
      });
    }

    appViewModel.init();

    // load locally stored favourites
    appViewModel.loadFavourites();

    // get latest tones from soundshed api
    appViewModel.loadLatestTones();

    if (UIFeatureToggleStore.getRawState().enabledPGToneCloud) {
      appViewModel.loadLatestToneCloudTones();
    }

    lessonManager.loadFavourites();
    //appViewModel.performArtistSearch("Metallica");
    // mock amp connection and current preset
    /* DeviceStore.update(s=>{
      s.isConnected=true; 
      s.presetTone=TonesStateStore.getRawState().storedPresets[0];
      s.connectedDevice= {name:"Mock Amp", address:"A1:B2:C3:D4:E5"};
    });*/
  }, []);

  return (
    <main>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <NavLink
            to="/"
            exact
            className="nav-link"
            activeClassName="nav-link active"
          >
            Home
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink
            to="/tones"
            className="nav-link"
            activeClassName="nav-link active"
          >
            Tones
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/device"
            className="nav-link"
            activeClassName="nav-link active"
          >
            Amp
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/lessons"
            className="nav-link"
            activeClassName="nav-link active"
          >
            Jam
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to="/about"
            className="nav-link"
            activeClassName="nav-link active"
          >
            About
          </NavLink>
        </li>

        <li className="my-2">
          {isUserSignedIn ? (
            <span
              className="badge rounded-pill bg-primary"
              onClick={performSignOut}
            >
              {" "}
              <FontAwesomeIcon icon={faUser}></FontAwesomeIcon> {userInfo?.name}
            </span>
          ) : (
            <Button
              className="btn btn-sm"
              onClick={() => {
                requireSignIn();
              }}
            >
              <FontAwesomeIcon icon={faUser}></FontAwesomeIcon>
            </Button>
          )}
        </li>
      </ul>

      <LoginControl
        signInRequired={signInRequired}
        onSignIn={performSignIn}
        onRegistration={performRegistration}
      ></LoginControl>

      <EditToneControl></EditToneControl>

      <AppViewModelContext.Provider value={appViewModel}>
        <DeviceViewModelContext.Provider value={deviceViewModel}>
          <Switch>
            <Route path="/" exact component={HomeControl} />
            <Route path="/device">
              {isNativeMode ? (
                isConnected ? (
                  <DeviceMainControl></DeviceMainControl>
                ) : (
                  <DeviceSelectorControl></DeviceSelectorControl>
                )
              ) : (
                <AmpOfflineControl></AmpOfflineControl>
              )}
            </Route>
            <Route path="/tones">
              <ToneBrowserControl></ToneBrowserControl>
            </Route>
            <Route path="/lessons">
              <LessonsControl></LessonsControl>
            </Route>
            <Route path="/about" exact component={AboutControl} />
          </Switch>
        </DeviceViewModelContext.Provider>
      </AppViewModelContext.Provider>
    </main>
  );
};

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById("app")
);
