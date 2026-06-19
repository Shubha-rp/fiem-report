import axios from "axios";

async function getUserInfo() {
  const response = await axios.get("/user-api/attributes", {
    withCredentials: true,
  });

  return response.data;
}

async function getScimUser(email) {
  try {
    const response = await axios.get(
      `/scim-proxy?email=${encodeURIComponent(email)}`,
      {
        withCredentials: true,
      }
    );

    return response.data?.Resources?.[0];
  } catch (err) {
  if (err.response?.status === 403) {
  document.body.innerHTML = `
    <div style="
      display:flex;
      justify-content:center;
      align-items:center;
      height:100vh;
      flex-direction:column;
      font-family:Arial,sans-serif;
      background:#f5f7fa;
      text-align:center;
      padding:20px;
    ">
      <h2 style="color:#d32f2f;margin-bottom:10px;">
        Access Denied
      </h2>

      <p style="font-size:16px;color:#333;">
        You are not authorized to access this application.
      </p>

      <p style="font-size:14px;color:#666;margin-top:10px;">
        Redirecting to login page...
      </p>

      <div style="
        margin-top:20px;
        width:220px;
        height:4px;
        background:#ddd;
        overflow:hidden;
        border-radius:2px;
      ">
        <div style="
          width:100%;
          height:100%;
          background:#0b3d91;
          animation: loading 3s linear forwards;
        "></div>
      </div>
    </div>

    <style>
      @keyframes loading {
        from { width: 0%; }
        to   { width: 100%; }
      }
    </style>
  `;

  setTimeout(() => {
    window.location.href = "/do/logout";
  }, 3000);

  return null;
}

    throw err;
  }
}

export async function getUserAttributes() {
  const userInfo = await getUserInfo();

  console.log("XSUAA User Info", userInfo);

  const scimUser = await getScimUser(userInfo.email);

  if (!scimUser) {
    return {
      data: {
        email: userInfo.email,
        login_name: [""],
        type: [""],
      },
    };
  }

  console.log("SCIM User", scimUser);

  return {
    data: {
      email: userInfo.email,
      login_name: [scimUser.userName || ""],
      type: [scimUser.userType || "partner"],
    },
  };
}