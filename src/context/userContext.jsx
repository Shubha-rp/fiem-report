import React, { createContext, useContext, useEffect, useState } from "react";
import { getUserAttributes } from "../lib/userService";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loginId, setLoginId] = useState("");
  const [loginType, setLoginType] = useState("");
  const [loginName, setLoginName] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUserAttributes()
      .then((response) => {
        const userData = response.data;

        const id = userData.login_name?.[0] || "";
        const type = userData.type?.[0] || "";
        const name = userData.login_name?.[0]  || "";

        const sapLoginType =
          type === "employee" ? "E" : "P";

        const userRole =
          type === "employee" ? "employee" : "partner";

        console.log("Login ID:", id);

        setUser(userData);
        setRole(userRole);
        setLoginId(id);
        setLoginType(sapLoginType)
        setLoginName(name);

        // Authorization is already handled in server.js
        setAuthorized(true);
      })
      .catch((err) => {
        console.error(
          "UserContext: failed to load user attributes",
          err
        );

        setAuthorized(false);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        role,
        loginId,
        loginType,
        loginName,
        authorized,
        loading,
        error,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);

  if (!ctx) {
    throw new Error(
      "useUser must be used inside <UserProvider>"
    );
  }

  return ctx;
}