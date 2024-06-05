/* eslint-disable @typescript-eslint/no-explicit-any */
// Install Material-UI if not already installed
// npm install @mui/material @emotion/react @emotion/styled

import { useState, CSSProperties } from "react";
import {
  Button,
  TextField,
  Typography,
  Container,
  CssBaseline,
  Avatar,
  FormHelperText,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { validateEmail, validatePassword } from "@/pages/Login/validators";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Navigate } from "react-router-dom";
import axios, { AxiosError, AxiosResponse } from "axios";
import { BASE_URL } from "@/config/default";
import LoginData from "@/types/LoginData";
import { addUser, selectIsLoggedIn, selectUser } from "@/redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectAllHomeStates, setIsLoggedIn } from "@/pages/Home/homeSlice";
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

interface LoginResponse {
  data: LoginData | null;
  success: boolean;
  message: string | null;
  error: string | null;
}
interface DecodedToken {
  email: string;
  given_name: string;
  [key: string]: any;
}

const styles = {
  paper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  } as CSSProperties,
  avatar: {
    margin: "8px",
    backgroundColor: "secondary",
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: "8px",
  },
  submit: {
    margin: "24px 0 16px",
  },
};

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  if (isLoggedIn) {
    return <Navigate to="/DAOMatcher" replace />;
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: any) => {
    e.preventDefault();
    if (!validateEmail(email, setEmailError)) {
      console.log("Email is invalid : ", email);
      return;
    }

    if (!validatePassword(password, setPassError)) {
      console.log("Password is invalid: ", email);
      return;
    }

    console.log(`Email: ${email} Password: ${password}`);

    let data: LoginResponse;
    try {
      const { data: successData }: AxiosResponse<LoginResponse> =
        await axios.post(
          `${BASE_URL}/api/auth/login`,
          {
            email,
            password,
          },
          { withCredentials: true }
        );
      data = successData;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData: LoginResponse = error
          ? error.response
            ? error.response.data
              ? error.response.data
              : null
            : null
          : null;
        data = errorData
          ? errorData
          : {
              success: false,
              data: null,
              error: "Login Failed due to server error",
              message: null,
            };
      } else {
        data = {
          success: false,
          data: null,
          error: "Something went wrong with your login",
          message: null,
        };
      }
    }

    const { success, message, error, data: loginData } = data;
    setSuccess(success);
    dispatch(addUser(loginData));

    if (!success) {
      return setError(message ?? error ?? "Something went wrong");
    } else {
      setEmail("");
      setPassword("");
      setSuccessMessage(message ?? "Login Successful");
      setError("");

      return <Navigate to="/DAOMatcher" replace />;
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div style={styles.paper}>
        <Avatar style={styles.avatar} src="vite.svg" />
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <form
          style={styles.form}
          noValidate
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleLogin(event);
            }
          }}
        >
          {error ? <Alert severity="error">{error}</Alert> : null}
          {success && successMessage ? (
            <Alert severity="success">{successMessage}</Alert>
          ) : null}
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateEmail(email, setEmailError)}
          />
          <FormHelperText error>{emailError}</FormHelperText>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => validatePassword(password, setPassError)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormHelperText error>{passError}</FormHelperText>
          <Button
            type="button"
            fullWidth
            variant="contained"
            color="primary"
            style={styles.submit}
            onClick={handleLogin}
          >
            Sign In
          </Button>
        </form>

        <GoogleLogin
          onSuccess={credentialResponse => {
            const decoded: DecodedToken = jwtDecode(credentialResponse?.credential);
             let email = decoded.email;
             let name = decoded.name;
            // setEmail(decoded.email);
            // setName(decoded.name);
            console.log('Decoded JWT:', decoded);
            console.log('Email:', email);
            console.log('Name:', name);

            // Prepare data to send to backend
      const data = {
        name,
        email
      };

      // Send data to backend
      fetch(`${BASE_URL}/api/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
        // Handle successful login, maybe redirect the user or show a message
      })
      .catch((error) => {
        console.error('Error:', error);
        // Handle errors
      });
    

          }}
          onError={() => {
            console.log('Login Failed');
          }}
        />

      </div>
    </Container>
  );
};

export default LoginPage;
