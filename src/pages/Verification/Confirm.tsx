import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, CircularProgress, Box } from "@mui/material";
import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "@/config/default";
import { selectToken } from "@/redux/userSlice";
import { useSelector } from "react-redux";
import AuthResponse from "@/types/AuthTypes";

type ConfirmationStatus = "pending" | "success" | "error";

function Confirm() {
  const navigate = useNavigate();
  const [confirmationStatus, setConfirmationStatus] =
    useState<ConfirmationStatus>("pending");
  const authtoken = useSelector(selectToken);
  //useParam
  const token = window.location.pathname.split("/").pop();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response: AxiosResponse<AuthResponse> = await axios.get(
          `${BASE_URL}/api/auth/confirm/${token}`,
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${authtoken}` },
          }
        );

        if (response.status === 200) {
          setConfirmationStatus("success");
        } else {
          setConfirmationStatus("error");
        }
      } catch (error) {
        setConfirmationStatus("error");
      }
    };

    verifyToken();
  }, [token]);

  useEffect(() => {
    if (confirmationStatus === "success") {
      navigate("/");
    }
  }, [confirmationStatus, navigate]);

  let ConfirmationMessageComponent;
  switch (confirmationStatus) {
    case "pending":
      ConfirmationMessageComponent = (
        <>
          <CircularProgress />
          <Typography variant="body1">Verifying...</Typography>
        </>
      );
      break;
    case "error":
      ConfirmationMessageComponent = (
        <Typography variant="body1">
          Error confirming email. Please try again later.
        </Typography>
      );
      break;
    default:
      ConfirmationMessageComponent = null;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Typography variant="h2">Email Confirmation</Typography>
      {ConfirmationMessageComponent}
    </Box>
  );
}

export default Confirm;
