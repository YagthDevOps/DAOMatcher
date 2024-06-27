import { useState, useEffect } from "react";
import { Typography, Container, Box, Button } from "@mui/material";
import { MailOutline } from '@mui/icons-material';
import { selectToken, selectUser } from "@/redux/userSlice";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from '@/config/default';
import axios, { AxiosError, AxiosResponse } from "axios";
import AlertMessage from "@/components/ui/AlertMessage";
import AuthResponse from '@/types/AuthTypes'

type Severity = "error" | "warning" | "info" | "success";

export default function Verification() {
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(120);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [alert, setAlert] = useState<{ message: string; severity: Severity } | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
    return () => {
      clearInterval(countdown);
    };
  }, [token, navigate]);

  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (resendDisabled && countdown > 0) {
      countdownTimer = setInterval(() => {
        setCountdown(prevCountdown => Math.max(0, prevCountdown - 1));
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
    return () => clearInterval(countdownTimer);
  }, [resendDisabled, countdown]);

  const handleResendClick = async () => {
    if (!resendDisabled) {
      setResendDisabled(true);
      setCountdown(120);

      try {
        const { data: successData }: AxiosResponse<AuthResponse> = await axios.get(
          `${BASE_URL}/api/auth/confirm/resend`,
          {
            withCredentials: true, headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (successData.success) {
          setAlert({ message: successData.message || 'Verification email resent successfully', severity: 'success' });
        } else {
          setAlert({ message: successData.message || 'The email is already verified', severity: 'info' });
        }
      } catch (error) {
        let errorData: AuthResponse | null = null;

        if (error instanceof AxiosError) {
          if (error.response && error.response.data) {
            errorData = error.response.data;
          }
        }

        const data = errorData ?? {
          success: false,
          data: null,
          error: "Failed to resend verification email due to server error",
          message: null,
        };

        setAlert({ message: `${data.error}`, severity: 'error' });
      }

      setTimeout(() => {
        setResendDisabled(false);
      }, 120000);
    }
  };


  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
      <Container maxWidth="sm" style={{ display: "flex", flexDirection: "column" }}>
        <Box display="flex" justifyContent="center" alignItems="center" mb={2}>
          <MailOutline style={{ fontSize: 50 }} />
        </Box>
        <Typography variant="h5" align="center" gutterBottom>
          Verify Your Email Address
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          We've sent an email to <strong>{user.email}</strong> to verify your email address.
        </Typography>
        <br />
        <Typography variant="body2" gutterBottom align="center">
          If you didn't receive the verification email, click the button below
          {countdown > 0 && ` after ${countdown} seconds`}
        </Typography>
        <Button variant="contained" onClick={handleResendClick} disabled={resendDisabled}>
          Resend The Verification Email
        </Button>
        {alert && <AlertMessage message={alert.message} severity={alert.severity} />}
      </Container>
    </div>
  );
}
