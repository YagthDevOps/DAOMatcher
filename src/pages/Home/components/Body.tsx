import React, { useEffect, useRef } from "react";

import { Box, Container, TextField, Typography } from "@mui/material";
import { useState } from "react";
import CircularProgressWithLabel from "@/pages/Home/components/CircularProgressWithLabel";
import { Navigate } from "react-router-dom";
import {
  useHandleCancel,
  useHandleSubmit,
} from "@/pages/Home/buttonEventHooks";
import useSocket from "@/pages/Home/useSocket";
import { selectAllUsers } from "@/pages/Home/usersSlice";
import { useDispatch, useSelector } from "react-redux";
import {
  selectAllHomeStates,
  setConnect,
  setIsLoading,
  setIsTokenRefreshed,
} from "@/pages/Home/homeSlice";
import { clearError } from "@/pages/Home/homeSlice";
import { clearInfoMessages } from "@/redux/infoSlice";
import ErrorList from "@/pages/Home/components/ErrorList";
import UserHandleInput from "@/pages/Home/components/UserHandleInput";
import SearchButton from "@/pages/Home/components/SearchButton";
import CancelButton from "@/pages/Home/components/CancelButton";
import UsersList from "@/pages/Home/components/UsersList";
import CountInput from "@/pages/Home/components/CountInput";
import DepthInput from "@/pages/Home/components/DepthInput";
import { clearUser, selectToken, selectUser } from "@/redux/userSlice";
import SocketContext from "../../../redux/SocketContext";

import { selectSearchParams } from "@/redux/searchParamSlice";

function Body() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [count, setCount] = useState<number>(10);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [depth, setDepth] = useState<number>(20);
  const depthRef = useRef<number>(depth);
  const socket = useSocket({ count, depth: depthRef });

  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [resubmit, setResubmit] = useState<boolean>(false);
  // const [estimation, setEstimation] = useState<string>("");

  const users = useSelector(selectAllUsers);
  const success = useSelector(selectAllHomeStates).success;
  const isLoading = useSelector(selectAllHomeStates).isLoading;
  const progress = useSelector(selectAllHomeStates).progress;
  const inputError = useSelector(selectAllHomeStates).error;
  const connect = useSelector(selectAllHomeStates).connect;
  const disconnect = useSelector(selectAllHomeStates).disconnect;
  const isTokenRefreshed = useSelector(selectAllHomeStates).isTokenRefreshed;

  const userData = useSelector(selectUser);
  const token = useSelector(selectToken);

  const searchParam = useSelector(selectSearchParams);
  // const resubmitCount = useSelector(selectResubmitCount);

  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectAllHomeStates).isLoggedIn;

  const { handleCancel } = useHandleCancel();
  const { handleSubmit } = useHandleSubmit(
    descriptionInput,
    count,
    depthRef.current
  );

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(clearError());
    dispatch(clearInfoMessages());
    setDescriptionInput(e.target.value);
  };

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.valueAsNumber;
    setDepth(newValue);
    depthRef.current = newValue;
  };

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearInfoMessages());
  }, []);

  useEffect(() => {
    if (users.length === 0 && success) dispatch(setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, success]);

  useEffect(() => {
    if (!socket.current.connected && connect) {
      socket.current.connect();
    }
    if (socket.current.connected && disconnect) {
      socket.current.emit("remove", userData.id);
      socket.current.disconnect();
    }
    if (isTokenRefreshed) {
      socket.current.io.opts.query = { token };
      console.log("Socket update with new token");
      socket.current.connect();
      dispatch(setConnect(true));
      dispatch(setIsTokenRefreshed(false));
      setResubmit(true);
    }
  }, [connect, disconnect, token, isTokenRefreshed]);

  useEffect(() => {
    if (resubmit) {
      console.log("resending search parameters");
      console.log("SearchParam: ", searchParam);
      socket.current.emit("search", searchParam);
      dispatch(setIsLoading(true));
      setResubmit(false);
    }
    return () => {
      setResubmit(false);
    };
  }, [resubmit, searchParam]);
  if (!isLoggedIn) {
    dispatch(clearUser());
    return <Navigate to="/login" />;
  }

  return (
    <center>
      <Container maxWidth="lg">
        <Box sx={{ margin: "5rem 0" }}>
          <Container maxWidth="md">
            <Typography variant="h5">
              Search for people with similar interests
            </Typography>

            <ErrorList inputError={inputError} success={success} />

            <Box sx={{ height: "2rem" }} />

            <UserHandleInput />

            <Box sx={{ height: "1rem" }} />

            <Box>
              <TextField
                id="outlined-textarea"
                label="Search description"
                // placeholder="Placeholder"
                rows={2}
                multiline
                fullWidth
                value={descriptionInput}
                onChange={handleDescriptionChange}
                size="small"
              />
            </Box>

            <Box sx={{ height: "1rem" }} />

            <CountInput
              isLoading={isLoading}
              count={count}
              handleChange={(_: Event, v: number | number[]) => {
                setCount(v as number);
                setDepth((v as number) * 2);
              }}
            />

            <DepthInput
              isLoading={isLoading}
              depth={depth}
              count={count}
              handleDepthChange={handleDepthChange}
            />
            <SocketContext.Provider value={socket.current}>
              <Box sx={{ height: "2rem" }} />
              <SearchButton isLoading={isLoading} handleSubmit={handleSubmit} />
              <CancelButton isLoading={isLoading} handleCancel={handleCancel} />
              <CircularProgressWithLabel
                style={{ margin: "1rem" }}
                value={progress}
                isLoading={isLoading}
              />
            </SocketContext.Provider>
          </Container>
        </Box>

        <UsersList users={users} />
      </Container>
    </center>
  );
}

export default Body;
