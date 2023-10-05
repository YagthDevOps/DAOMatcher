import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  IconButton,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import io, { Socket } from 'socket.io-client';
import { useEffect, useState } from "react";
import User from "./User/User";
import AddIcon from "@mui/icons-material/Add";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import { json2csv } from "json-2-csv";
import CircularProgressWithLabel from "./CircularProgressWithLabel/CircularProgressWithLabel";

export interface IUser {
  id: string;
  username: string;
  name: string;
  score: number;
  handle: string;
}

export interface Response {
  result: IUser[];
}

function valuetext(value: number) {
  return `${value}°C`;
}

function Body() {
  const [handle, setHandle] = useState<string[]>([]);
  const [handleInput, setHandleInput] = useState<string>("");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [users, setUsers] = useState<IUser[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [count, setCount] = useState<any>(100);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [depth, setDepth] = useState<any>(200);
  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [error, setError] = useState<any>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [estimation, setEstimation] = useState<string>("");
  const [jsonData, setJsonData] = useState<IUser[]>([]);
  const [channelId, setChannelId] = useState<string>("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [socket, setSocket] = useState<Socket<any, any>>()

  const BASE_URL = "http://localhost:5001/";
  const addHandler = () => {
    if (handleInput != "") {
      setHandle([...handle, handleInput]);
      setHandleInput("");
    }
  };

  async function convertToCSV(jsonData: IUser[]) {
    try {
      const csv = await json2csv(jsonData);
      return csv;
    } catch (err) {
      console.error("Error converting JSON to CSV:", err);
      return null;
    }
  }

  const handleDownloadClick = async () => {
    const csv = await convertToCSV(jsonData);
    if (csv) {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.valueAsNumber;
    setDepth(newValue);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const changeHandleInput = (e: any) => {
    setError(null);
    if (e.key === "Enter") {
      addHandler();
      return;
    }
    setHandleInput(e.target.value);
  };
  const deleteHandle = (h: string) => {
    setHandle(handle.filter((e) => e != h));
  };

  const handleCancel = () => {
    setSuccess(false)
    setError("Request canceled by user")
    console.log(socket);
    console.log("cancel triggered")
    if (socket) socket.emit("stop", true)
    else setError("Couldn't cancel request")
    setIsLoading(false)
  }

  const handleSubmit = async () => {
    setSuccess(false);
    const requestBody = {
      handle,
      descriptionInput,
      count,
    };
    console.log(requestBody);

    if (handle.length > 0 && descriptionInput != "") {
      setIsLoading(true);
      setError(null);
      setUsers([]);
      try {
        const response = await fetch(BASE_URL, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: descriptionInput,
            user_list: handle,
            user_limit: count,
            depth: depth,
          }),
        });

        const data = (await response.json()) as Response;
        console.log(data); //For debugging only

        const { result: users } = data;
        users.sort((a, b) => b.score - a.score);

        setUsers(users);
        setSuccess(true);
        setError(null)
        setJsonData(users);

      } catch (error) {

        console.log("Error: ", error);

        if (error instanceof Error) setError(error.message);
        else setError("Something went wrong while fetching users")

        setSuccess(false);
      } finally {
        setProgress(0);
        setIsLoading(false);
      }
    } else {
      setError("Empty handles or description!");
      setSuccess(false);
    }
  };

  useEffect(() => {
    // Connect to the Socket.IO server

    try {
      const socket = io(`http://localhost:5001`);
      setSocket(socket)

      socket.on('connect', () => {
        console.log('Connected to the Socket.IO server');
      });

      socket.on("new_user_connected", (data) => {
        console.log(data)
        const { channel } = data
        setChannelId(channel)
      })

      socket.on("connect_error", () => {
        console.log("Couldn't establish connection to server")
      })

      socket.on("connect_timeout", () => {
        console.log("Connection timed out")
      })

      socket.on('disconnect', () => {
        console.log('Disconnected from the Socket.IO server');
      });

      socket.on(`update-${channelId}`, (data) => {
        console.log("Update recieved");
        try {
          console.log("recieved data: ", data);

          const { progress: tempProgress, curr_user: user } = data;

          if (!tempProgress) {
            console.log(data.error);
          } else {
            console.log("tempProgress: ", tempProgress);
            console.log("user: ", user);

            const percentage = (tempProgress / depth) * 100;
            setProgress(percentage);
          }
        } catch (error) {
          console.log(error);
          if (error instanceof ErrorEvent) setError(error.message)
          else setError("Something went wrong connecting to socket io")
          setSuccess(false)
        }
      })

      socket.on("error", (error) => {
        console.log("Error: ", error);
        setError(error.message ?? "Something went wrong");
        setSuccess(false);
      })

      return () => {
        socket.disconnect();
      };

    } catch (error) {
      console.log(error);
      if (error instanceof ErrorEvent)
        setError(error.message ?? "Something went wrong")
      setSuccess(false)
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  function formatTime(milliseconds: number) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);

    const hrsStr = hours > 0 ? `${hours} hrs` : "";
    const minsStr = minutes > 0 ? `${minutes} mins` : "";
    const secStr = seconds > 0 ? `${seconds} secs` : "";
    const formattedDuration = `${hrsStr} ${minsStr} ${secStr}`;

    return formattedDuration;
  }

  useEffect(() => {
    const milliseconds = depth * 3474;
    const timeString = formatTime(milliseconds);

    setEstimation(timeString);
  }, [depth]);

  return (
    <center>
      <Container maxWidth="lg">
        <Box sx={{ margin: "5rem 0" }}>
          <Container maxWidth="md">
            <Typography variant="h5">
              Search for people with similar interests
            </Typography>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? (
              <Alert severity="success">Loading successful</Alert>
            ) : null}

            <Box sx={{ height: "2rem" }} />
            <Stack direction="row">
              <TextField
                id="outlined-basic"
                label="User handles"
                variant="outlined"
                fullWidth
                onChange={changeHandleInput}
                value={handleInput}
                onKeyDown={changeHandleInput}
                size="small"
                placeholder="LinkedIn or Mastodon handle"
              />
              <IconButton
                aria-label="delete"
                size="medium"
                onClick={addHandler}
              >
                <AddIcon fontSize="inherit" />
              </IconButton>
            </Stack>
            <Box sx={{ margin: "1rem 0" }}>
              {handle.length ? (
                handle.map((h, i) => (
                  <Chip
                    label={h}
                    key={i}
                    onDelete={() => deleteHandle(h)}
                    sx={{ margin: "0.5rem" }}
                  />
                ))
              ) : (
                <Typography variant="body2">
                  Handle list will appear here
                </Typography>
              )}
            </Box>
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
                onChange={(e) => {
                  setError(null);
                  setDescriptionInput(e.target.value);
                }}
                size="small"
              />
            </Box>
            <Box sx={{ height: "1rem" }} />
            <div style={{ alignSelf: "left" }}>
              <Typography id="users-slider" gutterBottom>
                How many results?
              </Typography>
            </div>
            <Slider
              aria-label="Temperature"
              defaultValue={100}
              getAriaValueText={valuetext}
              valueLabelDisplay="auto"
              step={100}
              marks
              min={100}
              max={1000}
              aria-labelledby="users-slider"
              size="small"
              onChange={(_, v) => {
                setCount(v);
                setDepth((v as number) * 2);
              }}
              value={count}
            />
            <Stack direction="row">
              <TextField
                aria-label="Enter depth for the search"
                placeholder="Choose depth"
                label="Depth of search"
                type="number"
                value={depth}
                onChange={handleDepthChange}
              />
              <div
                style={{
                  marginTop: "1rem",
                  marginLeft: "1rem",
                  color: "#4f4c4c",
                }}
              >
                <Typography id="users-slider" fontSize={14} gutterBottom>
                  {`Searching ${count} users using depth of ${depth} takes minimum of ${estimation}`}
                </Typography>
              </div>
            </Stack>

            <Box sx={{ height: "2rem" }} />
            {!isLoading ? (<Button
              disabled={isLoading}
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              size="small"
            >
              Search
            </Button>) : null}
            {isLoading ? (<Button
              disabled={!isLoading}
              variant="contained"
              fullWidth
              onClick={handleCancel}
              size="small"
            >
              Cancel
            </Button>) : null}
            {isLoading ? (
              <CircularProgressWithLabel
                style={{ margin: "1rem" }}
                value={progress}
              />
            ) : null}
          </Container>
        </Box>
        <Divider flexItem>
          {users && users.length && (
            <Stack direction={"row"}>
              <Typography>
                {" "}
                <IconButton
                  style={{ marginRight: "0.5rem" }}
                  aria-label="Download results"
                  size="medium"
                  onClick={handleDownloadClick}
                >
                  <DownloadRoundedIcon color="success" />
                </IconButton>
                Results
              </Typography>
            </Stack>
          )}
        </Divider>
        <Container maxWidth="sm">
          {users && users.length
            ? users.map((user) => (
              <User key={user.id + Math.random() * 10} user={user} />
            ))
            : null}
        </Container>
      </Container>
    </center>
  );
}

export default Body;

// username list
// description
// amount of users
