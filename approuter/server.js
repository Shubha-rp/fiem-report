const approuter = require("@sap/approuter");
const axios = require("axios");

const app = approuter();

app.beforeRequestHandler.use("/scim-proxy", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "Email is required" }));
      return;
    }

    const response = await axios.get(
      `${process.env.SCIM_URL}/scim/Users?filter=emails.value eq "${email}"`,
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.SCIM_USER}:${process.env.SCIM_PASSWORD}`
            ).toString("base64"),
        },
      }
    );

    const matchedUser = response.data?.Resources?.[0];
    const loginName = matchedUser?.userName;

    const allowedLoginName = process.env.ALLOWED_LOGIN_NAME;

    console.log(
      `LOGIN=${loginName} ALLOWED=${allowedLoginName}`
    );

    if (!allowedLoginName) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "ALLOWED_LOGIN_NAME not configured",
        })
      );
      return;
    }
    if (!loginName || loginName !== allowedLoginName) {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "This user is not authorized",
        })
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response.data));
  } catch (err) {
    console.error("SCIM proxy error:", err);

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "SCIM call failed",
        detail: err.message,
      })
    );
  }
});
app.beforeRequestHandler.use("/do/logout", (req, res) => {
  const idpBaseUrl = process.env.IDP_BASE_URL;
  const appUrl = process.env.APP_URL;

  if (!idpBaseUrl || !appUrl) {
    res.statusCode = 500;
    res.end("Logout configuration missing");
    return;
  }

  const logoutUrl =
    `${idpBaseUrl}/oauth2/logout?post_logout_redirect_uri=${encodeURIComponent(appUrl)}`;

  console.log("Redirecting to logout:", logoutUrl);

  res.statusCode = 302;
  res.setHeader("Location", logoutUrl);
  res.end();
});

app.start();