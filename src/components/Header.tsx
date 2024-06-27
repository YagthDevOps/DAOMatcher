import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import { CONSTANTS } from "@/config/default";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { selectUser, clearUser } from "@/redux/userSlice";
import { useDispatch } from "react-redux";
import { setIsLoggedIn } from "@/pages/Home/homeSlice";


function Header() {
  const { pathname } = useLocation();
  const showNavbar = CONSTANTS.PRIVATE_ROUTES.includes(pathname);
  const user = useSelector((state: RootState) => selectUser(state));
  const dispatch = useDispatch();
  const navigate = useNavigate();


  const settings = [
    { name: "Profile", link: "/profile" },
    { name: "History", link: "/history" },
  ];

  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(
    null,
  );

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogOut = () => {
    localStorage.clear();
    dispatch(clearUser());
    dispatch(setIsLoggedIn(false));
    navigate("/login");
  };

  if (!showNavbar) {
    return <></>;
  }

  return (
    <AppBar position="static" sx={{ background: "white", boxShadow: "2" }}>
      <Container maxWidth="xl">
        <Toolbar
          disableGutters
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "roboto",
              fontWeight: 800,
              letterSpacing: ".05rem",
              color: "black",
              textDecoration: "none",
            }}
          >
            DAOMacther
          </Typography>

          {/*
					 *mobile scrren
					 */}
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "roboto",
              fontWeight: 600,
              letterSpacing: ".05rem",
              color: "black",
              textDecoration: "none",
            }}
          >
            DAOMacther
          </Typography>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                {/*
								 *TODO:MAKE THE image url /hello DYNAMIC
								 */}
                <Avatar
                  alt="Profile image"
                  sx={{ width: "100%" }}
                  src={`${CONSTANTS.URL.GET_RANDOM_IMAGE}/${user.display_name}`}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((url) => (
                <MenuItem key={url.link} onClick={handleCloseUserMenu}>
                  <Typography
                    component="a"
                    sx={{
                      color: "black",
                      textDecoration: "none",
                      minWidth: "100px",
                    }}
                    textAlign="center"
                    href={url.link}
                  >
                    {url.name}
                  </Typography>
                </MenuItem>
              ))}

              {/*
							 *logout
							 */}

              <MenuItem onClick={handleLogOut}>
                <Typography
                  component="a"
                  sx={{
                    color: "black",
                    textDecoration: "none",
                    minWidth: "100px",
                  }}
                  textAlign="center"
                >
                  Logout
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;
