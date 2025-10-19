import React from "react";
import { useState, useEffect } from "react";
import { Login } from "./Login";
import { MainView } from "./MainView";

async function validateToken(token) {
  if (!token) {
    return false;
  }

  try {
    const response = await fetch("http://localhost:5001/api/verify-token", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return response.ok;
    }
  } catch (error) {
    alert(error);
  }
}

export function App() {
  const [page, setPage] = useState("login");

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (await validateToken(token)) {
        setPage("MainView");
      }
    };
    checkAuth();
  }, []);

  if (page === "login") {
    return <Login setPage={setPage} />;
  } else if (page === "MainView") {
    return <MainView />;
  }
}
