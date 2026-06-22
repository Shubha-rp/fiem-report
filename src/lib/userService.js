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
  sessionStorage.removeItem('auto_reloaded');

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
      <div style="
        background:white;
        padding:40px;
        border-radius:12px;
        box-shadow:0 4px 20px rgba(0,0,0,0.1);
        min-width:350px;
      ">
        <h2 style="color:#d32f2f;margin-bottom:10px;">Access Denied</h2>
        <p style="font-size:16px;color:#333;margin-bottom:8px;">
          You are not authorized to access this application.
        </p>
        <p style="font-size:14px;color:#666;margin-bottom:20px;">
          Redirecting to login page in 3 seconds...
        </p>
      </div>
    </div>
  `;

  setTimeout(() => {
    window.location.assign("/do/logout");
  }, 3000);

  return new Promise(() => {});
}
    throw err;
  }
}

export async function getUserAttributes() {
  const userInfo = await getUserInfo();

  console.log("XSUAA User Info", userInfo);

  const scimUser = await getScimUser(userInfo.email);

 if (!scimUser) {
  throw new Error("Unauthorized user");
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